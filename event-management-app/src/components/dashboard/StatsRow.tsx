import React from "react";
import { useNavigate } from "react-router-dom";

export type StatItem = {
  id: string;
  label: string;
  value: string | number;
};

type Props = {
  items: StatItem[];
};

const StatsRow: React.FC<Props> = ({ items }) => {
  const navigate = useNavigate();

  const handleCardClick = (id: string) => {
    if (id === "s1") {
      navigate("/registered-events");
    } else if (id === "s2") {
      navigate("/upcoming-events");
    } else if (id === "s3") {
      navigate("/attendance");
    }
  };

  return (
    <div className="stats-row" role="list" aria-label="dashboard statistics">
      {items.map((it) => (
        <div 
          key={it.id} 
          className="stat-card" 
          role="listitem"
          onClick={() => handleCardClick(it.id)}
          style={{ cursor: it.id === "s1" ? "pointer" : "default" }}
        >
          <div className="stat-label">{it.label}</div>
          <div className="stat-value">{it.value}</div>
        </div>
      ))}
    </div>
  );
};

export default StatsRow;
