import "./App.css";
import styled from "styled-components";
import Dashboard from "./Pages/Dashboard";

const Container = styled.div`
  background-color: #e4e4e4;
  height: 300vh;
`;

const TopBar = styled.div`
  background-color: #ffffff;
  box-shadow: 66px 22px 42px 0px rgba(199, 199, 199, 0.05),
    29px 10px 31px 0px rgba(199, 199, 199, 0.09),
    7px 2px 17px 0px rgba(199, 199, 199, 0.1);
  height: 5vh;
  text-align: center;
  padding-top: 3vh;
  padding-bottom: 1vh;
`;

function App() {
  return (
    <Container>
      <TopBar className="titletop">Premier Test</TopBar>
      <Dashboard />
    </Container>
  );
}

export default App;
