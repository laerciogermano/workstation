// Package config guarda o pareamento e as liberações, fora da pasta do projeto.
package config

import (
	"encoding/json"
	"errors"
	"io/fs"
	"os"
	"path/filepath"
	"runtime"

	"github.com/laerciogermano/plans-client/internal/policy"
)

type Config struct {
	Hub   string        `json:"hub"`
	Code  string        `json:"code"`
	Dir   string        `json:"dir"`
	Allow []policy.Rule `json:"allow"`
}

var ErrNotPaired = errors.New("client não pareado: rode plans-client pair <código> --dir <pasta>")

// Dir é a pasta de configuração do sistema; PLANS_CONFIG_DIR substitui (testes).
func Dir() (string, error) {
	if d := os.Getenv("PLANS_CONFIG_DIR"); d != "" {
		return d, nil
	}
	base, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	name := "plans"
	if runtime.GOOS != "linux" {
		name = "Plans"
	}
	return filepath.Join(base, name), nil
}

func path() (string, error) {
	d, err := Dir()
	return filepath.Join(d, "client.json"), err
}

func Load() (Config, error) {
	var c Config
	p, err := path()
	if err != nil {
		return c, err
	}
	raw, err := os.ReadFile(p)
	if errors.Is(err, fs.ErrNotExist) {
		return c, ErrNotPaired
	}
	if err != nil {
		return c, err
	}
	return c, json.Unmarshal(raw, &c)
}

// Save grava de forma atômica e só com acesso do dono.
func Save(c Config) error {
	p, err := path()
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(p), 0o700); err != nil {
		return err
	}
	raw, err := json.MarshalIndent(c, "", "  ")
	if err != nil {
		return err
	}
	tmp, err := os.CreateTemp(filepath.Dir(p), "client-*.tmp")
	if err != nil {
		return err
	}
	defer os.Remove(tmp.Name())
	if _, err := tmp.Write(append(raw, '\n')); err == nil {
		err = tmp.Sync()
	}
	if cerr := tmp.Close(); err == nil {
		err = cerr
	}
	if err != nil {
		return err
	}
	return os.Rename(tmp.Name(), p)
}

func Delete() error {
	p, err := path()
	if err != nil {
		return err
	}
	if err := os.Remove(p); err != nil && !errors.Is(err, fs.ErrNotExist) {
		return err
	}
	return nil
}

type Project struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// ReadProject lê o .plans/project.json criado pelo front.
func ReadProject(dir string) (Project, error) {
	var p Project
	raw, err := os.ReadFile(filepath.Join(dir, ".plans", "project.json"))
	if err != nil {
		return p, errors.New("a pasta não é um projeto do Plans (falta .plans/project.json): abra a pasta primeiro no navegador")
	}
	if err := json.Unmarshal(raw, &p); err != nil || p.ID == "" {
		return p, errors.New(".plans/project.json inválido")
	}
	return p, nil
}
