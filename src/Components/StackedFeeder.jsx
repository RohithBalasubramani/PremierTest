import React, { useEffect, useState, useRef } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import * as XLSX from "xlsx";
import DateTimePicker from "./Datetimepicker";

// Register the chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ExcelCompositeChart = () => {
  const [chartData, setChartData] = useState(null); // Initialized as null to prevent rendering too early
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDateTime, setStartDateTime] = useState(
    new Date("July 7 2024, 11:00:00")
  );
  const [endDateTime, setEndDateTime] = useState(
    new Date("July 7 2024, 12:00:00")
  );
  const chartRef = useRef(null); // For handling chart instance

  // Function to convert Excel date serial number to JavaScript Date
  const convertExcelDateToJSDate = (serial) => {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    const fractional_day = serial - Math.floor(serial) + 0.0000001;
    const total_seconds = Math.floor(86400 * fractional_day);
    const seconds = total_seconds % 60;
    const hours = Math.floor(total_seconds / 3600);
    const minutes = Math.floor((total_seconds - hours * 3600) / 60);

    // Set the time components
    date_info.setSeconds(seconds);
    date_info.setMinutes(minutes);
    date_info.setHours(hours);

    return date_info;
  };

  useEffect(() => {
    const fetchExcelData = async () => {
      try {
        const response = await fetch("/Assets/FeederKw.xlsx");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });

        // Parse the first sheet
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Convert Excel serial dates to JavaScript Date format and filter
        const labels = jsonData
          .map((row) => {
            const excelDate = row["DATE & TIME"];
            return convertExcelDateToJSDate(excelDate);
          })
          .filter((date) => date >= startDateTime && date <= endDateTime)
          .map((date) => date.toLocaleString());

        // Relevant keys for the stacked bar chart (all feeders)
        const relevantKeys = [
          "Alkaline_1_Kwh",
          "ALOXPECVD_2_KW",
          "ALOXPECVD_3_KW",
          "Diffusion-1_KW",
          "Diffusion_2_KW",
          "Diffusion_3_KW",
          "Diffusion_4_KW",
          "Ext_D1_Heater_KW",
          "Ext_D2_Heater_KW",
          "Ext_D3_Heater_KW",
          "Ext_D4_Heater_KW",
          "HotWaterTank_1_KW",
          "HotWaterTank_2_KW",
          "PreAnnealing_1_KW",
          "PreAnnealing_2_KW",
          "Texture_1_KW",
        ];

        const colors = [
          "rgba(255, 99, 132, 0.6)", // Alkaline
          "rgba(54, 162, 235, 0.6)", // ALOXPE
          "rgba(75, 192, 192, 0.6)", // ALOXPE 3
          "rgba(153, 102, 255, 0.6)", // Diffusion
          "rgba(255, 159, 64, 0.6)", // Diffusion 2
          "rgba(255, 206, 86, 0.6)", // Diffusion 3
          "rgba(54, 162, 235, 0.6)", // Diffusion 4
          "rgba(75, 192, 192, 0.6)", // Ext D1 Heater
          "rgba(153, 102, 255, 0.6)", // Ext D2 Heater
          "rgba(255, 99, 132, 0.6)", // Ext D3 Heater
          "rgba(255, 206, 86, 0.6)", // Ext D4 Heater
          "rgba(54, 162, 235, 0.6)", // HotWater Tank 1
          "rgba(75, 192, 192, 0.6)", // HotWater Tank 2
          "rgba(153, 102, 255, 0.6)", // PreAnnealing 1
          "rgba(255, 159, 64, 0.6)", // PreAnnealing 2
          "rgba(255, 99, 132, 0.6)", // Texture 1
        ];

        // Generate datasets for stacked bar chart
        const barDatasets = relevantKeys.map((key, index) => ({
          label: key,
          data: jsonData
            .map((row) => row[key])
            .filter((_, i) => {
              const date = convertExcelDateToJSDate(jsonData[i]["DATE & TIME"]);
              return date >= startDateTime && date <= endDateTime;
            }),
          backgroundColor: colors[index % colors.length],
          borderColor: colors[index % colors.length],
          borderWidth: 1,
          yAxisID: "y1", // Use y-axis for the bar datasets
        }));

        // Generate dataset for total column (line chart)
        const lineDataset = {
          label: "Total",
          data: jsonData
            .map((row) => row["total"])
            .filter((_, i) => {
              const date = convertExcelDateToJSDate(jsonData[i]["DATE & TIME"]);
              return date >= startDateTime && date <= endDateTime;
            }),
          borderColor: "rgba(255, 0, 0, 1)", // Red for total line
          backgroundColor: "rgba(255, 0, 0, 0.2)",
          borderWidth: 2,
          fill: false,
          type: "line",
          pointRadius: 3,
          pointHoverRadius: 6,
          tension: 0.4,
          yAxisID: "y2", // Use a secondary y-axis for the line dataset
        };

        // Combine the bar and line datasets
        setChartData({
          labels: labels,
          datasets: [...barDatasets, lineDataset],
        });

        setLoading(false);
      } catch (error) {
        console.error("Error fetching or parsing Excel data:", error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchExcelData();
  }, [startDateTime, endDateTime]);

  useEffect(() => {
    // Clean up the chart when the component unmounts or before a new chart is rendered
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: true, // Stack the bars
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
          borderDash: [8, 4],
        },
      },
      y1: {
        type: "linear",
        position: "left",
        stacked: true, // Stack the bars
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          beginAtZero: true,
        },
      },
      y2: {
        type: "linear",
        position: "right",
        grid: {
          drawOnChartArea: false, // Prevent grid lines from appearing on the bars
        },
        ticks: {
          beginAtZero: true,
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: "bottom",
      },
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="containergraph">
      <h2>Feeders Stacked</h2>
      <DateTimePicker
        startDateTime={startDateTime}
        setStartDateTime={setStartDateTime}
        endDateTime={endDateTime}
        setEndDateTime={setEndDateTime}
      />
      {chartData && chartData.labels && chartData.labels.length > 0 && (
        <div className="chart">
          <Bar ref={chartRef} data={chartData} options={options} />
        </div>
      )}
    </div>
  );
};

export default ExcelCompositeChart;
