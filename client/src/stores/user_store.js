import {decorate, observable} from "mobx";
import socketIOClient from "socket.io-client";
import sortBy from 'lodash/sortBy'

class UserStore {
  constructor() {
    this.user = {
      userName: "",
      userId: "",
      users: [],
      kicked: false,
      userIsConnecting:false,
      connected: false,
      admin: false
    }

    this.room = {
      roomName: "",
      roomId: "",
      rooms: [],
      cardResults: [],
      cardsAreTheSame: false,
      waiting: 0
    }

    this.jira = {
      jiraBoardsFetching: false,
      jiraBoards: [],
      activeBoardFetching: false,
      activeBoard: {
        issues: []
      },
      title: "",
      description: "",
      jiraLoggedIn: false,
      issueId:"",
      boardId:"",
      estimationScore: ""
    }

    this.notificationMessage = null
    this.notificationVariant = "info"
    this.blockCard = false
    this.openJoinDialog = false
    this.socket = socketIOClient(process.env.ENDPOINT);
    this.socket.on("sendCard", (response) => {
      if (response){
        let card = sortBy(response, "cardValue")
        const allEqual = arr => arr.every( v => v.cardValue === arr[0].cardValue )
        this.room.cardsAreTheSame = allEqual( card )

        if (!this.room.cardsAreTheSame) {
          card[card.length -1].color =  card[0].color = "#E33B3B"
          this.room.cardResults = card
        }else {
          for (let i = 0; i < card.length; i++) {
            card[i].color = "#37C26D"
          }
          this.room.cardResults = card
        }
      }
    });
    this.socket.on("waitingFor", (response) => {
      if (response){
        this.room.waiting = response
      }
    });
    this.socket.on("resetCards", () => {
      this.room.cardResults = []
      this.blockCard = this.room.cardsAreTheSame = false
      this.jira.description = this.jira.title = ""
      this.notificationVariant = "info"
      this.notificationMessage = "Card reset"
    });
    this.socket.on("kickUser", (data) => {
      if (data){
        if (this.user.userId !== "" && this.user.userId === data.userId) {
          this.user.kicked = true
          this.user.admin = this.openJoinDialog = false;
          this.user.userName = this.room.roomName = this.user.userId = this.room.roomId = ""
          this.notificationVariant = "error"
          this.notificationMessage = "You have been kicked from the Room"
        }
      }
    })
    this.socket.on("changeAdmin", (data) => {
      if (data){
        if (this.user.userId === data) {
          this.user.admin = true
          // this.notificationVariant = "info"
          // this.notificationMessage = "You have been given admin privileges"
        }
      }
    })
    this.socket.on("broadcastTitle", (title) => {
      if (title){
        this.jira.title = title
      }
    })
    this.socket.on("broadcastDescription", (description) => {
      this.jira.description = description
    })
    this.socket.on("errors", (description) => {
      if (description){
        this.notificationVariant = "error"
        this.notificationMessage = description.error
      }
    })
  }

  createRoom(userName, roomName, roomPassword) {
    this.user.userName = userName;
    localStorage.setItem('userName', JSON.stringify(userName));
    const data = {
      userName: this.user.userName,
      roomName,
      roomPassword
    };
    this.socket.emit("createRoom", data);
    this.socket.on("createRoom", response => {
      this.user.userId = response.user[response.user.length - 1].userId;
      this.room.roomId = response.roomId;
      this.room.roomName = response.roomName
      this.openJoinDialog = false
      this.user.admin = true
      this.user.connected = true
      this.notificationVariant = "success"
      this.notificationMessage = "You have created a Room"
    });
  }

  deleteRoom(roomId, roomPassword){
    const data = {
      roomId,
      roomPassword
    };
    this.socket.emit("deleteRoom", data);
  }

  fetchRooms() {
    this.socket.on("fetchRooms", (response) => {
      this.room.rooms = response;
    });
  }

  joinRoom(roomId, roomPassword, userName) {
    this.user.userName = userName;
    localStorage.setItem('userName', JSON.stringify(userName));
    const data = {
      userName: this.user.userName,
      roomId: roomId,
      roomPassword: roomPassword
    };
    this.socket.emit("joinRoom", data);
    this.socket.on("joinRoom", (response) => {
      this.user.userId = response.user[response.user.length - 1].userId;
      this.room.roomId = response.roomId;
      this.room.roomName = response.roomName
      this.jira.openJoinDialog = false
      this.user.connected = true
      this.notificationVariant = "success"
      this.notificationMessage = "You have joined to the Room"
    });
  }

  sendCard(card) {
    const data = {
      userName: this.user.userName,
      roomId: this.room.roomId,
      cardValue: card
    };
    this.socket.emit("sendCard", data);
  }

  resetCards() {
    const data = {
      roomId: this.room.roomId,
    };
    this.socket.emit("resetCards", data);

  }

  fetchUsers() {
    const data = {
      roomId: this.room.roomId,
    };
    this.socket.emit("fetchUsers", data)
    this.socket.on("fetchUsers", (response) => {
      this.user.users = response;
    });
  }

  kickUser(userId) {
    const data = {
      userId: userId,
    };
    this.socket.emit("kickUser", data)
  }

  changeAdmin(userId) {
    const data = {
      userId: userId,
    };
    this.socket.emit("changeAdmin", data)
  }

  broadcastTitle() {
    const data = {
      title: this.jira.title,
      roomId: this.room.roomId,
    };
    this.socket.emit("broadcastTitle", data)
  }

  broadcastDescription() {
    const data = {
      description: this.jira.description,
      roomId: this.room.roomId,
    };
    this.socket.emit("broadcastDescription", data)
  }

  jiraLogin(jiraSubdomain, jiraLogin, jiraPassword) {
    this.jira.jiraBoardsFetching = true
    const data = {
      jiraSubdomain: jiraSubdomain,
      jiraLogin: jiraLogin,
      jiraPassword: jiraPassword
    };
    this.socket.emit("jiraLogin", data)
    this.socket.on("jiraLogin", (data) => {
      if (data){
        this.jira.jiraLoggedIn = true
        this.jira.jiraBoards = data
        this.jira.jiraBoardsFetching = false
      }
    })
  }

  selectBoard(boardId) {
    this.jira.activeBoardFetching = true
    this.socket.emit("jiraGetBoard", boardId)
    this.socket.on("jiraGetBacklogBoard", (data) => {
      this.jira.activeBoard.issues = []
      this.jira.activeBoard.issues = [...this.jira.activeBoard.issues, ...data.issues]

    })
    this.socket.on("jiraGetBoard", (data) => {
      this.jira.activeBoard.issues = []
      this.jira.activeBoard.issues = [...this.jira.activeBoard.issues, ...data.issues]
      this.jira.activeBoardFetching = false
    })

  }

  setIssueEstimation() {
    const data = {
      issueId: this.jira.issueId,
      boardId: this.jira.boardId,
      estimationScore: this.room.cardResults[0].cardValue
    };
    if (this.jira.issueId !== undefined) {
      this.socket.emit("jiraSetEstimation", data)
    }
  }
}

decorate(UserStore, {
  user: observable,
  room: observable,
  jira: observable,
  socket: observable,
  notificationMessage: observable,
  notificationVariant: observable,
  blockCard: observable,
  openJoinDialog: observable
});

export default UserStore;
