package exec

import (
	"errors"
	"path/filepath"
	"strings"
)

// ResolveDir confina a subpasta pedida à pasta pareada, inclusive através de links simbólicos.
func ResolveDir(root, sub string) (string, error) {
	if filepath.IsAbs(sub) || filepath.VolumeName(sub) != "" || strings.HasPrefix(sub, "/") || strings.HasPrefix(sub, `\`) {
		return "", errors.New("a subpasta precisa ser relativa à pasta do projeto")
	}
	realRoot, err := filepath.EvalSymlinks(root)
	if err != nil {
		return "", errors.New("pasta do projeto não encontrada")
	}
	dir, err := filepath.EvalSymlinks(filepath.Join(realRoot, sub))
	if err != nil {
		return "", errors.New("subpasta não encontrada")
	}
	rel, err := filepath.Rel(realRoot, dir)
	if err != nil || rel == ".." || strings.HasPrefix(rel, ".."+string(filepath.Separator)) {
		return "", errors.New("a subpasta sai da pasta do projeto")
	}
	return dir, nil
}
