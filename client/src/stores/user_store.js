import {decorate, observable} from "mobx";
import socketIOClient from "socket.io-client";
import sortBy from "lodash/sortBy"
import React from "react";

class UserStore {
  constructor() {
    this.user = {
      userName: "",
      userId: "",
      users: [],
      kicked: false,
      userIsConnecting: false,
      connected: false,
      admin: false
    };

    this.room = {
      roomName: "",
      roomId: "",
      rooms: [],
      cardResults: [],
      cardHistory: [],
      cardsAreTheSame: false,
      waiting: []
    };

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
      issueId: "",
      issueKey: "",
      boardId: "",
      estimationScore: ""
    };

    this.notificationMessage = null;
    this.notificationVariant = "info";
    this.blockCard = false;
    this.blockReset = true;
    this.openJoinDialog = false;
    this.socket = socketIOClient(process.env.ENDPOINT);

    this.socket.on("sendCard", (response) => {
      this.room.waiting = [];
      if (response) {
        console.log(response, "sendCard")
        this.blockReset = false;
        let card = sortBy(response, "cardValue");
        const allEqual = arr => arr.every(v => v.cardValue === arr[0].cardValue);
        this.room.cardsAreTheSame = allEqual(card);

        if (!this.room.cardsAreTheSame) {
          card[card.length - 1].color = card[0].color = "#E33B3B";
          this.room.cardResults = card
        } else {
          for (let i = 0; i < card.length; i++) {
            card[i].color = "#37C26D"
          }
          this.room.cardResults = card
        }
      }
    });

    this.socket.on("waitingFor", (response) => {
      if (response && this.room.cardResults.length === 0) {
        this.room.waiting = [];

        for (let i = 0; i < response; i++) {
          console.log(response, "waitingFor")

          this.room.waiting.push(true)
        }
      }
    });

    this.socket.on("resetCards", (data) => {
      this.blockReset = true;
      this.room.cardResults = [];
      this.blockCard = this.room.cardsAreTheSame = false;
      this.jira.description = this.jira.title = "";
      this.notificationVariant = "info";
      this.notificationMessage = "Card reset";
      if (data) {
        console.log(data, "cardHistory")
        this.room.cardHistory = data
      }

    });

    this.socket.on("kickUser", (data) => {
      if (data) {
        if (this.user.userId !== "" && this.user.userId === data.userId) {
          this.user.kicked = true;
          this.user.admin = this.openJoinDialog = false;
          this.user.userName = this.room.roomName = this.user.userId = this.room.roomId = "";
          this.notificationVariant = "error";
          this.notificationMessage = "You have been kicked from the Room";
        }
      }
    });

    this.socket.on("changeAdmin", (data) => {
      if (data) {
        if (this.user.userId === data && this.user.admin === false) {
          this.user.admin = true;
          this.notificationVariant = "info";
          this.notificationMessage = "You have been given admin privileges";
        }
      }
    });

    this.socket.on("broadcastTitle", (title) => {
      if (title) {
        this.jira.title = title
      }
    });

    this.socket.on("broadcastDescription", (description) => {
      this.jira.description = description
    });

    this.socket.on("deleteRoom", () => {
      window.location.href = "/"
    });

    this.socket.on("errors", (description) => {
      if (description) {
        this.notificationVariant = "error";
        this.notificationMessage = description.error
      }
    })
  }

  createRoom(userName, roomName, roomPassword) {
    this.user.userName = userName;
    localStorage.setItem("userName", JSON.stringify(userName));
    const data = {
      userName: this.user.userName,
      roomName,
      roomPassword
    };
    this.openJoinDialog = false;
    this.user.connected = true;
    this.socket.emit("createRoom", data);
    this.socket.on("createRoom", response => {
      this.user.userId = response.user[response.user.length - 1].userId;
      this.room.roomId = response.roomId;
      this.room.roomName = response.roomName;
      this.user.admin = true;
      this.notificationVariant = "success";
      this.notificationMessage = "You have created a Room";
      this.fetchUsers()
    });
  }

  saveBoardId(boardId, roomId) {
    const data = {
      roomId,
      boardId,
    };
    this.socket.emit("saveBoardId", data);
  }

  deleteRoom(roomId, roomPassword) {
    const data = {
      roomId,
      roomPassword
    };
    this.socket.emit("deleteRoom", data);
  }

  joinRoom(roomId, roomPassword, userName) {
    this.user.userName = userName;
    localStorage.setItem("userName", JSON.stringify(userName));
    const data = {
      userName: this.user.userName,
      roomId,
      roomPassword
    };
    this.openJoinDialog = false
    this.user.connected = true
    this.socket.emit("joinRoom", data);
    this.socket.on("joinRoom", (response) => {
      if (localStorage.getItem("jira-credentials") !== null && localStorage.getItem("jira-subdomains") !== null) {
        const data = JSON.parse(localStorage.getItem("jira-credentials"));
        const subdomains = JSON.parse(localStorage.getItem("jira-subdomains"));
        this.jiraLogin(subdomains[0], data.jiraLogin, data.jiraPassword)
      }
      console.log(response)
      this.user.userId = response.user[response.user.length - 1].userId;
      this.room.roomId = response.roomId;
      this.room.roomName = response.roomName
      this.room.cardHistory = response.gameHistory || []
      this.jira.boardId = response.boardId

      this.notificationVariant = "success"
      this.notificationMessage = "You have joined to the Room"
      if (response.boardId) {
        this.selectBoard(this.jira.boardId)
      }
      this.fetchUsers()
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
    if (this.jira.issueKey) {
      const data = {
        roomId: this.room.roomId,
        issueKey: this.jira.issueKey
      };
      this.socket.emit("resetCards", data);
    } else {
      const data = {
        roomId: this.room.roomId,
      };
      this.socket.emit("resetCards", data);
    }

  }

  fetchUsers() {
    const data = {
      roomId: this.room.roomId,
    };
    setInterval(() => {
      this.socket.emit("fetchUsers", data)
    }, 1000)
    this.socket.on("fetchUsers", (response) => {
      this.user.users = response;
    });
  }

  kickUser(userId) {
    const data = {
      userId
    };
    this.socket.emit("kickUser", data)
  }

  changeAdmin(userId) {
    const data = {
      userId
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
      jiraSubdomain,
      jiraLogin,
      jiraPassword
    };
    this.socket.emit("jiraLogin", data)
    this.socket.on("jiraLogin", (data) => {
      if (data) {
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
      this.jira.activeBoard.issues = [...this.jira.activeBoard.issues, ...data]
      this.socket.on("jiraGetBoard", (data) => {
        this.jira.activeBoard.issues = [...this.jira.activeBoard.issues, ...data]
        this.jira.activeBoardFetching = false
      })
    })


  }

  setIssueEstimation() {
    const data = {
      issueId: this.jira.issueId,
      boardId: this.jira.boardId,
      estimationScore: this.room.cardResults[0].cardValue
    };
    if (this.jira.issueId) {
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
  blockReset: observable,
  openJoinDialog: observable
});

export default UserStore;
