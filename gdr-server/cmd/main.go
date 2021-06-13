package main

import (
	"fmt"
	"os"

	"github.com/simoneroc/gdr/internal/cmd/gdr"
)

func main() {
	cmd := gdr.NewCmd()
	if err := cmd.Execute(); err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	}
}
