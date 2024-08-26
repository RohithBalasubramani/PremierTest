import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const DateTimePicker = ({
  startDateTime,
  setStartDateTime,
  endDateTime,
  setEndDateTime,
}) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "20px",
      }}
    >
      <div>
        <label>Start Date-Time: </label>
        <DatePicker
          selected={startDateTime}
          onChange={(date) => setStartDateTime(date)}
          showTimeSelect
          dateFormat="Pp"
        />
      </div>
      <div>
        <label>End Date-Time: </label>
        <DatePicker
          selected={endDateTime}
          onChange={(date) => setEndDateTime(date)}
          showTimeSelect
          dateFormat="Pp"
        />
      </div>
    </div>
  );
};

export default DateTimePicker;
