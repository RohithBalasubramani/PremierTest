import React, { useEffect, useState, useRef } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import * as XLSX from "xlsx";
import DateTimePicker from "./Datetimepicker";

// Register scales and other required components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ExcelLineChart = () => {
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

  // Function to generate color shades dynamically
  const generateShade = (baseColor, index, totalShades) => {
    const alpha = 1 - (index / totalShades) * 0.4;
    return baseColor.replace(/1\)$/, `${alpha})`);
  };

  useEffect(() => {
    const fetchExcelData = async () => {
      try {
        const response = await fetch("/Assets/Htdata.xlsx");
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

        // Extracting all relevant keys dynamically
        const relevantKeys = [
          "HT_OG1_R_Current",
          "HT_OG1_Y_Current",
          "HT_OG1_B_Current",
          "HT_OG2_R_Current",
          "HT_OG2_Y_Current",
          "HT_OG2_B_Current",
        ];

        // Base colors for R, Y, and B
        const baseColors = {
          R: "rgba(255, 0, 0, 1)", // Red
          Y: "rgba(245, 230, 83, 1)", // Yellow
          B: "rgba(0, 0, 255, 1)", // Blue
        };

        // Automatically generate datasets
        const datasets = relevantKeys
          .map((key, index) => {
            const colorKey = key.split("_")[2]; // Extract R, Y, or B part

            if (!baseColors[colorKey]) {
              console.error(`Invalid colorKey: ${colorKey}`);
              return null;
            }

            const totalShades = relevantKeys.filter((k) =>
              k.includes(colorKey)
            ).length;
            const shade = generateShade(
              baseColors[colorKey],
              index % totalShades,
              totalShades
            ); // Generate shade for this dataset

            return {
              label: key,
              data: jsonData
                .map((row) => row[key])
                .filter((_, index) => {
                  const date = convertExcelDateToJSDate(
                    jsonData[index]["DATE & TIME"]
                  );
                  return date >= startDateTime && date <= endDateTime;
                }),
              fill: false,
              borderColor: shade,
              borderWidth: 2,
              pointRadius: 3,
              pointHoverRadius: 6,
              tension: 0.4,
            };
          })
          .filter((dataset) => dataset !== null); // Filter out any null datasets caused by invalid keys

        // Add average current datasets for HT_OG1 and HT_OG2
        const averageOG1 = jsonData
          .map(
            (row) =>
              (row["HT_OG1_R_Current"] +
                row["HT_OG1_Y_Current"] +
                row["HT_OG1_B_Current"]) /
              3
          )
          .filter((_, index) => {
            const date = convertExcelDateToJSDate(
              jsonData[index]["DATE & TIME"]
            );
            return date >= startDateTime && date <= endDateTime;
          });

        const averageOG2 = jsonData
          .map(
            (row) =>
              (row["HT_OG2_R_Current"] +
                row["HT_OG2_Y_Current"] +
                row["HT_OG2_B_Current"]) /
              3
          )
          .filter((_, index) => {
            const date = convertExcelDateToJSDate(
              jsonData[index]["DATE & TIME"]
            );
            return date >= startDateTime && date <= endDateTime;
          });

        datasets.push({
          label: "HT_OG1_Avg_Current",
          data: averageOG1,
          fill: false,
          borderColor: "rgba(75, 192, 192, 1)", // Light Blue for Average Current
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 6,
          tension: 0.4,
        });

        datasets.push({
          label: "HT_OG2_Avg_Current",
          data: averageOG2,
          fill: false,
          borderColor: "rgba(153, 102, 255, 1)", // Light Purple for Average Current
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 6,
          tension: 0.4,
        });

        setChartData({
          labels: labels,
          datasets: datasets,
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
        type: "category", // Ensure correct scale type is registered
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
          borderDash: [8, 4],
        },
        ticks: {
          autoSkip: true,
          maxTicksLimit: 10,
        },
      },
      y: {
        stacked: false,
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
      <h2>HT Current Chart</h2>
      <DateTimePicker
        startDateTime={startDateTime}
        setStartDateTime={setStartDateTime}
        endDateTime={endDateTime}
        setEndDateTime={setEndDateTime}
      />
      {chartData && chartData.labels && chartData.labels.length > 0 && (
        <div className="chart">
          <Line ref={chartRef} data={chartData} options={options} />
        </div>
      )}
    </div>
  );
};

export default ExcelLineChart;
