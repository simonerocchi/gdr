package ws

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/Mind-Informatica-srl/restapi/pkg/actions"
	"github.com/Mind-Informatica-srl/restapi/pkg/logger"
	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/simoneroc/gdr/internal/configuration"
	"github.com/simoneroc/gdr/internal/model"
	"gorm.io/gorm"
)

var ONLINE_MESSAGE = "{\"online\":true,\"uuidFrom\":\"0\",\"invitato\":\"1\"}"
var OFFLINE_MESSAGE = "{\"online\":false,\"uuidFrom\":\"0\"}"
var MEDICO_ONLINE_MESSAGE = "{\"online\":true,\"medico\":true,\"uuidFrom\":\"0\"}"
var PAZIENTE_ONLINE_MESSAGE = "{\"online\":true,\"paziente\":true,\"uuidFrom\":\"0\"}"

type OnlineMessage struct {
	UuidFrom   string
	Online     bool
	InvitatoID int
	Medico     bool
	Paziente   bool
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

// Room maintains the set of active clients and broadcasts messages to the
// clients.
type Room struct {
	// Registered clients.
	clients map[int]*Client
	//medico *Client
	//paziente *Client
	//invitati *[]Client

	// Inbound messages from the clients.
	clientBroadcast chan []byte
	//medicoBroadcast   chan []byte
	//pazienteBroadcast chan []byte

	// Register requests from the clients.
	registerClient chan *Client
	//registerMedico   chan *Client
	//registerPaziente chan *Client

	// Unregister requests from clients.
	unregisterClient chan *Client
	//unregisterMedico   chan *Client
	//unregisterPaziente chan *Client

	idVisita int

	uuidPaziente string
	uuidMedico   string
}

type baseMessage struct {
	UuidTo string
}

/*func newRoom(idVisita int) *Room {
	return &Room{
		medicoBroadcast:    make(chan []byte),
		pazienteBroadcast:  make(chan []byte),
		registerMedico:     make(chan *Client),
		registerPaziente:   make(chan *Client),
		unregisterMedico:   make(chan *Client),
		unregisterPaziente: make(chan *Client),
		idVisita:           idVisita,
	}
}*/
func newRoom(idVisita int) *Room {
	return &Room{
		clients:          make(map[int]*Client),
		clientBroadcast:  make(chan []byte),
		registerClient:   make(chan *Client),
		unregisterClient: make(chan *Client),
		idVisita:         idVisita,
	}
}

func (h *Room) Run() {
	for {
		fmt.Println("ROOM RUN INIZIO")
		select {
		case client := <-h.registerClient:
			for _, c := range h.clients {
				m := model.Messaggio{
					UtenteID: c.uuid,
					Tipo:     "STATO",
					Content: map[string]interface{}{
						"Online": true,
					},
					Utente: *c.utente,
					Dest:   client.uuid,
				}
				sendMessageToClient(client, m)
			}
			h.clients[client.uuid] = client
			//si comopne il messaggio
			m := model.Messaggio{
				UtenteID: client.uuid,
				Tipo:     "STATO",
				Content: map[string]interface{}{
					"Online": true,
				},
				Utente: *client.utente,
			}
			h.sendMessage(m)
		case client := <-h.unregisterClient:
			delete(h.clients, client.uuid)
			close(client.send)
			m := model.Messaggio{
				UtenteID: client.uuid,
				Tipo:     "STATO",
				Content: map[string]interface{}{
					"Online": false,
				},
				Utente: *client.utente,
			}
			h.sendMessage(m)
			if len(h.clients) == 0 {
				h.Close()
				return
			}
		case message := <-h.clientBroadcast:
			var msg model.Messaggio
			err := json.Unmarshal(message, &msg)
			if err != nil {
				return
			}
			c := h.clients[msg.UtenteID]
			msg.Utente = *c.utente
			h.sendMessage(msg)
		}
		fmt.Println("ROOM RUN FINE")
	}

}

func (r *Room) sendMessage(messaggio model.Messaggio) error {
	if messaggio.Dest != 0 {
		n := time.Now()
		messaggio.DataOra = &n
		db := configuration.Current().DB
		if err := db.Create(&messaggio).Error; err != nil {
			logger.Log().Error(err, "error saving message", "messaggio", messaggio)
		}
		if c, ok := r.clients[messaggio.Dest]; ok {
			if err := sendMessageToClient(c, messaggio); err != nil {
				return err
			}
		}
	} else {
		var err error
		if messaggio, err = messaggio.Process(); err != nil {
			messaggio.Dest = messaggio.UtenteID
			r.sendMessage(messaggio)
			return nil
		}
		for uuid := range r.clients {
			messaggio.Dest = uuid
			r.sendMessage(messaggio)
		}
	}
	return nil

}

func sendMessageToClient(c *Client, messaggio model.Messaggio) error {
	if message, err := json.Marshal(messaggio); err != nil {
		return err
	} else {
		sendBytes(c, message)
	}
	return nil
}

func sendBytes(c *Client, msg []byte) {
	c.send <- msg
}

func (h *Room) Close() {
	delete(rooms, h.idVisita)
}

var rooms = make(map[int]*Room)

// serveWs handles websocket requests from the peer.

func ServeWs(w http.ResponseWriter, r *http.Request) *actions.ActionError {
	upgrader.CheckOrigin = func(r *http.Request) bool {
		return true
	}
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return &actions.ActionError{Err: err, Status: http.StatusInternalServerError}
	}
	vars := mux.Vars(r)
	token := vars["id"]
	t, err := configuration.Current().JwtEngine.ParseJWT(token)
	if err != nil {
		return &actions.ActionError{Err: err, Status: http.StatusInternalServerError}
	}
	// recupero la sessione dal db
	// var log = r.Context().Value(mindlogger.LoggerContextKey).(*mindlogger.AppLogger)

	db := configuration.Current().DB
	sessione := model.Sessione{
		ID: t.Subject,
	}
	if err := db.Preload("Utente").First(&sessione).
		Error; errors.Is(err, gorm.ErrRecordNotFound) {
		return &actions.ActionError{Err: err, Status: http.StatusUnauthorized}
	} else if err != nil {
		return &actions.ActionError{Err: err, Status: http.StatusInternalServerError}
	}
	// verifico la password
	if valid, err := sessione.IsPasswordValid(t.SharedSecret); err != nil {
		return &actions.ActionError{Err: err, Status: http.StatusInternalServerError}
	} else if !valid {
		return &actions.ActionError{Err: errors.New("sessione non valida"), Status: http.StatusInternalServerError}
	}
	//recupero la room della visita
	var room = rooms[0]
	//se non esiste la creo e la avvio
	if room == nil {
		room = newRoom(0)
		rooms[0] = room
		go room.Run()
	}
	//creo il client
	client := &Client{
		room:   room,
		conn:   conn,
		send:   make(chan []byte, 256),
		uuid:   sessione.UtenteID,
		utente: sessione.Utente,
	}
	//lo assegno alla room
	/*if client.medico {
		room.registerMedico <- client
	} else if client.paziente {
		room.registerPaziente <- client
	} else {

	}*/
	room.registerClient <- client
	//lo avvio
	go client.writePump()
	go client.readPump()
	return nil
}
