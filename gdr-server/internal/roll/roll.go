package roll

import (
	"errors"
	"math/rand"
	"strconv"
	"strings"
)

type RollResult struct {
	V       int
	Dices   []int
	Choices [2]int
	Result  int
	Critic  *bool
}

// Roll roll dice depending on command
func Roll(command string) (res RollResult, err error) {
	if strings.HasPrefix(command, "/roll ") {
		dice := strings.Split(command, "/roll ")[1]
		var v int
		if dice == "" {
			v = 0
		} else if v, err = strconv.Atoi(dice); err != nil {
			err = errors.New("invalid command: " + command)
			return
		}
		res = squidroll(v)
	} else {
		err = errors.New("invalid command: " + command)
	}
	return
}

// rand.Intn(6) + 1

func squidroll(v int) (roll RollResult) {
	if v == 0 {
		roll.Choices = [2]int{rand.Intn(6) + 1, rand.Intn(6) + 1}
		roll.Dices = roll.Choices[:]
	} else {
		roll.Dices = []int{rand.Intn(6) + 1, rand.Intn(6) + 1, rand.Intn(6) + 1}
		if (v == 2 || v == -2) &&
			(roll.Dices[0] == roll.Dices[1] ||
				roll.Dices[0] == roll.Dices[2] ||
				roll.Dices[1] == roll.Dices[2]) {
			if roll.Dices[0] == roll.Dices[1] || roll.Dices[0] == roll.Dices[2] {
				roll.Choices = [2]int{roll.Dices[0], roll.Dices[0]}
			} else {
				roll.Choices = [2]int{roll.Dices[1], roll.Dices[2]}
			}
			c := v > 0
			roll.Critic = &c
		} else {
			if compare(v)(roll.Dices[0], roll.Dices[1]) {
				roll.Choices[0] = roll.Dices[0]
				if compare(v)(roll.Dices[1], roll.Dices[2]) {
					roll.Choices[1] = roll.Dices[1]
				} else {
					roll.Choices[1] = roll.Dices[2]
				}
			} else {
				roll.Choices[0] = roll.Dices[1]
				if compare(v)(roll.Dices[0], roll.Dices[2]) {
					roll.Choices[1] = roll.Dices[0]
				} else {
					roll.Choices[1] = roll.Dices[2]
				}
			}
		}
	}
	roll.Result = roll.Choices[0] + roll.Choices[1]
	roll.V = v
	return
}

func compare(v int) (res func(int, int) bool) {
	if v > 0 {
		res = func(first int, second int) bool {
			return first < second
		}
	} else if v < 0 {
		res = func(first int, second int) bool {
			return first > second
		}
	}
	return
}
