// Package protocol espelha packages/protocol (TypeScript). Os dois passam nos mesmos vetores de teste.
package protocol

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/hkdf"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"strings"
)

const (
	Version         = 1
	MaxMessageBytes = 256 * 1024
	OutputChunk     = 16 * 1024

	codePrefix = "plans1_"
	salt       = "plans/v1"
	toClient   = "front->client"
	toFront    = "client->front"
)

var b64 = base64.RawURLEncoding

// Keys são derivadas da chave de pareamento. O hub só conhece Room.
type Keys struct {
	Room     string
	ToClient []byte
	ToFront  []byte
}

func DecodeCode(code string) ([]byte, error) {
	if !strings.HasPrefix(code, codePrefix) {
		return nil, errors.New("código de pareamento inválido")
	}
	secret, err := b64.DecodeString(strings.TrimPrefix(code, codePrefix))
	if err != nil || len(secret) != 32 {
		return nil, errors.New("código de pareamento inválido")
	}
	return secret, nil
}

func Derive(secret []byte) (Keys, error) {
	var k Keys
	room, err := hkdf.Key(sha256.New, secret, []byte(salt), "room", 16)
	if err != nil {
		return k, err
	}
	k.Room = hex.EncodeToString(room)
	if k.ToClient, err = hkdf.Key(sha256.New, secret, []byte(salt), toClient, 32); err != nil {
		return k, err
	}
	k.ToFront, err = hkdf.Key(sha256.New, secret, []byte(salt), toFront, 32)
	return k, err
}

// Relay é o envelope cifrado que passa pelo hub.
type Relay struct {
	Type string `json:"type"`
	IV   string `json:"iv"`
	Body string `json:"body"`
}

// Channel é o lado do client: cifra para o front e abre o que vem do front.
type Channel struct {
	Room    string
	in, out cipher.AEAD
	inAAD   []byte
	outAAD  []byte
}

func newGCM(key []byte) (cipher.AEAD, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}
	return cipher.NewGCM(block)
}

func NewClientChannel(secret []byte) (*Channel, error) {
	keys, err := Derive(secret)
	if err != nil {
		return nil, err
	}
	in, err := newGCM(keys.ToClient)
	if err != nil {
		return nil, err
	}
	out, err := newGCM(keys.ToFront)
	if err != nil {
		return nil, err
	}
	return &Channel{Room: keys.Room, in: in, out: out,
		inAAD: []byte(keys.Room + "|" + toClient), outAAD: []byte(keys.Room + "|" + toFront)}, nil
}

func (c *Channel) Seal(plaintext []byte) (Relay, error) {
	iv := make([]byte, 12)
	if _, err := rand.Read(iv); err != nil {
		return Relay{}, err
	}
	return c.sealWith(iv, plaintext), nil
}

func (c *Channel) sealWith(iv, plaintext []byte) Relay {
	body := c.out.Seal(nil, iv, plaintext, c.outAAD)
	return Relay{Type: "relay", IV: b64.EncodeToString(iv), Body: b64.EncodeToString(body)}
}

func (c *Channel) Open(r Relay) ([]byte, error) {
	iv, err := b64.DecodeString(r.IV)
	if err != nil || len(iv) != 12 {
		return nil, errors.New("iv inválido")
	}
	body, err := b64.DecodeString(r.Body)
	if err != nil {
		return nil, errors.New("corpo inválido")
	}
	return c.in.Open(nil, iv, body, c.inAAD)
}

// Inner é o conteúdo cifrado.
type Inner struct {
	Sender  string          `json:"sender"`
	Session string          `json:"session"`
	Seq     int64           `json:"seq"`
	Msg     json.RawMessage `json:"msg"`
}

// Command descreve o que executar: Program+Args, ou Script em um Shell.
type Command struct {
	Program string   `json:"program,omitempty"`
	Args    []string `json:"args,omitempty"`
	Script  string   `json:"script,omitempty"`
	Shell   string   `json:"shell,omitempty"`
	Cwd     string   `json:"cwd,omitempty"`
}

// Incoming reúne os campos das mensagens vindas do front.
type Incoming struct {
	Type       string `json:"type"`
	Nonce      string `json:"nonce"`
	RunID      string `json:"runId"`
	NodeID     string `json:"nodeId"`
	TimeoutSec int    `json:"timeoutSec"`
	FromChunk  int    `json:"fromChunk"`
	Command
}

type Hello struct {
	Type      string   `json:"type"`
	Nonce     string   `json:"nonce"`
	ProjectID string   `json:"projectId"`
	OS        string   `json:"os"`
	Arch      string   `json:"arch"`
	Shells    []string `json:"shells"`
	Version   string   `json:"version"`
}

// RunRef serve para exec.pending e exec.started.
type RunRef struct {
	Type  string `json:"type"`
	RunID string `json:"runId"`
}

type Output struct {
	Type   string `json:"type"`
	RunID  string `json:"runId"`
	N      int    `json:"n"`
	Stream string `json:"stream"`
	Data   string `json:"data"`
}

type Exit struct {
	Type       string `json:"type"`
	RunID      string `json:"runId"`
	Reason     string `json:"reason"`
	Code       int    `json:"code"`
	Chunks     int    `json:"chunks"`
	DurationMs int64  `json:"durationMs"`
	Truncated  bool   `json:"truncated"`
	Error      string `json:"error,omitempty"`
}

type Rejected struct {
	Type         string `json:"type"`
	RunID        string `json:"runId"`
	Reason       string `json:"reason"`
	AllowCommand string `json:"allowCommand,omitempty"`
}

type RunInfo struct {
	RunID     string `json:"runId"`
	NodeID    string `json:"nodeId,omitempty"`
	Status    string `json:"status"`
	StartedAt string `json:"startedAt"`
	Command
}

type Runs struct {
	Type string    `json:"type"`
	Runs []RunInfo `json:"runs"`
}
