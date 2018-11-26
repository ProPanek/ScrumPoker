import React from "react"
import {HistoryList} from "./history_list"
import {configure, shallow} from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import sinon from "sinon";

configure({adapter: new Adapter()});

describe("HistoryList", () => {
  it("renders without errors", () => {
    const props = {
      store: {
        room: {cardsAreTheSame: false, cardResults: [], cardHistory: []},
        user: {admin: true, users: []},
        jira: {activeBoardFetching: false, activeBoard: {issues: []}}
      }
    }

    const component = shallow(<HistoryList {...props} />)
    expect(component).toMatchSnapshot()
  })

})
