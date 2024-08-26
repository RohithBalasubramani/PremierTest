import React from "react";
import ExcelLineChart from "../Components/Graphs";
import PowerChartHT from "../Components/PowerChart";
import ExcelStackedBarChart from "../Components/StackedFeeder";

const Dashboard = () => {
  return (
    <div>
      <ExcelLineChart />
      <PowerChartHT />
      <ExcelStackedBarChart />
    </div>
  );
};

export default Dashboard;
