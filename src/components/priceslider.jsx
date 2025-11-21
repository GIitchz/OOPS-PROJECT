import * as React from "react";
import Slider from "@mui/material/Slider";

export default function PriceSlider({ min, max, value, onChange }) {
    // Ensure slider always receives numbers
    const safeValue = [
        Number(value[0]) || min,
        Number(value[1]) || max,
    ];

    return (
        <div style={{ width: "100%", padding: "10px 0" }}>
            <Slider
                value={safeValue}
                min={min}
                max={max}
                onChange={(e, newVal) => onChange(newVal)}
                valueLabelDisplay="auto"
                valueLabelFormat={(v) => `₹${v}`}
                sx={{
                    color: "#007bff",
                    height: 6,
                    "& .MuiSlider-thumb": {
                        height: 18,
                        width: 18,
                        backgroundColor: "#fff",
                        border: "2px solid #007bff",
                    },
                }}
            />

            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>₹{safeValue[0]}</span>
                <span>₹{safeValue[1]}</span>
            </div>
        </div>
    );
}
