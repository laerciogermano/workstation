package protocol

import (
	"encoding/hex"
	"encoding/json"
	"os"
	"testing"
)

type vectors struct {
	Code, Room, ToClient, ToFront string
	Messages                      []struct{ From, Plaintext, IV, Body string }
}

func load(t *testing.T) (vectors, []byte) {
	t.Helper()
	raw, err := os.ReadFile("../../../../packages/protocol/vectors/vectors.json")
	if err != nil {
		t.Fatal(err)
	}
	var v vectors
	if err := json.Unmarshal(raw, &v); err != nil {
		t.Fatal(err)
	}
	secret, err := DecodeCode(v.Code)
	if err != nil {
		t.Fatal(err)
	}
	return v, secret
}

func TestVectors(t *testing.T) {
	v, secret := load(t)
	keys, err := Derive(secret)
	if err != nil {
		t.Fatal(err)
	}
	if keys.Room != v.Room || hex.EncodeToString(keys.ToClient) != v.ToClient || hex.EncodeToString(keys.ToFront) != v.ToFront {
		t.Fatalf("derivação diverge do TypeScript: %+v", keys)
	}
	ch, err := NewClientChannel(secret)
	if err != nil {
		t.Fatal(err)
	}
	seen := 0
	for _, m := range v.Messages {
		switch m.From {
		case "front": // o client abre
			plain, err := ch.Open(Relay{IV: m.IV, Body: m.Body})
			if err != nil || string(plain) != m.Plaintext {
				t.Fatalf("não abriu a mensagem do front: %v %s", err, plain)
			}
			var in Inner
			var msg Incoming
			if json.Unmarshal(plain, &in) != nil || json.Unmarshal(in.Msg, &msg) != nil || msg.Program != "echo" || len(msg.Args) != 2 {
				t.Fatalf("mensagem mal interpretada: %+v", msg)
			}
			seen++
		case "client": // o client cifra igual ao TypeScript
			iv, _ := b64.DecodeString(m.IV)
			if got := ch.sealWith(iv, []byte(m.Plaintext)); got.Body != m.Body {
				t.Fatal("cifra diverge do TypeScript")
			}
			if _, err := ch.Open(Relay{IV: m.IV, Body: m.Body}); err == nil {
				t.Fatal("aceitou eco no mesmo sentido")
			}
			seen++
		}
	}
	if seen < 2 {
		t.Fatal("vetores incompletos")
	}
}

func TestBadCode(t *testing.T) {
	for _, c := range []string{"", "abc", "plans1_abc", "plans1_!!!"} {
		if _, err := DecodeCode(c); err == nil {
			t.Fatalf("aceitou %q", c)
		}
	}
}
