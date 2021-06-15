package roll

import (
	"errors"
	"math/rand"
	"strconv"
	"strings"
)

// Roll roll dice depending on command
func Roll(command string) ([]int, error) {
	if strings.HasPrefix(command, "/roll ") {
		dice := strings.Split(command, "/roll ")[1]
		var nd int
		var err error
		if nd, err = strconv.Atoi(dice); err != nil {
			return []int{}, errors.New("invalid command: " + command)
		}
		res := squidroll(nd)
		return res, nil
	} else {
		return []int{}, errors.New("invalid command: " + command)
	}
}

func squidroll(n int) []int {
	res := []int{}
	for i := 0; i < n; i += 1 {
		r := rand.Intn(6) + 1
		res = append(res, r)
		if r == 6 {
			r = squidroll(1)[0]
			res = append(res, r)
		}
	}
	return res
}
