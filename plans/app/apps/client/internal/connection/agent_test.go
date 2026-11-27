package connection

import "testing"

func TestCheckHub(t *testing.T) {
	for _, ok := range []string{"wss://plans.exemplo.com/ws", "ws://localhost:4780/ws", "ws://127.0.0.1:4780/ws", "ws://[::1]:1/ws"} {
		if err := CheckHub(ok); err != nil {
			t.Errorf("%s: %v", ok, err)
		}
	}
	for _, bad := range []string{"ws://plans.exemplo.com/ws", "http://localhost", "ws://localhost.mal.com/ws", "ws://10.0.0.1/ws", ""} {
		if CheckHub(bad) == nil {
			t.Errorf("aceitou %s", bad)
		}
	}
}
