import React, { useState, useEffect } from "react";

// TeamSelector component for selecting teams by level or manual input
export default function TeamSelector({ teamsByLevel, loading, value, onChange }) {
  const [useDropdown, setUseDropdown] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [manualInput, setManualInput] = useState("");

  // Update state when value prop changes
  useEffect(() => {
    if (value) {
      // Check if value matches any team in the list
      let foundInList = false;
      if (teamsByLevel && Object.keys(teamsByLevel).length > 0) {
        for (const level in teamsByLevel) {
          const team = teamsByLevel[level].find((t) => t.name === value);
          if (team) {
            setSelectedLevel(level);
            setSelectedTeam(value);
            setManualInput("");
            foundInList = true;
            setUseDropdown(true);
            break;
          }
        }
      }
      // If not found in list, it's a manual input
      if (!foundInList) {
        setManualInput(value);
        setSelectedLevel("");
        setSelectedTeam("");
        setUseDropdown(false);
      }
    } else {
      setSelectedTeam("");
      setManualInput("");
      setSelectedLevel("");
    }
  }, [value, teamsByLevel]);

  const handleLevelChange = (level) => {
    setSelectedLevel(level);
    setSelectedTeam("");
    onChange("");
  };

  const handleTeamChange = (teamName) => {
    setSelectedTeam(teamName);
    setManualInput("");
    onChange(teamName);
  };

  const handleManualInputChange = (inputValue) => {
    setManualInput(inputValue);
    setSelectedLevel("");
    setSelectedTeam("");
    onChange(inputValue);
  };

  const handleModeToggle = () => {
    const newMode = !useDropdown;
    setUseDropdown(newMode);
    if (newMode) {
      // Switching to dropdown - clear manual input
      setManualInput("");
      if (selectedTeam) {
        onChange(selectedTeam);
      } else {
        onChange("");
      }
    } else {
      // Switching to manual - clear dropdown selections
      setSelectedLevel("");
      setSelectedTeam("");
      if (manualInput) {
        onChange(manualInput);
      } else {
        onChange("");
      }
    }
  };

  const availableTeams = selectedLevel ? teamsByLevel[selectedLevel] || [] : [];

  if (loading) {
    return <div style={{ padding: "5px", color: "#666" }}>加载中...</div>;
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
        <button
          type="button"
          onClick={handleModeToggle}
          style={{
            padding: "2px 8px",
            fontSize: "12px",
            cursor: "pointer",
            backgroundColor: useDropdown ? "#e3f2fd" : "#f5f5f5",
            border: "1px solid #ccc",
            borderRadius: "3px"
          }}
        >
          {useDropdown ? "下拉选择" : "手动输入"}
        </button>
        <span style={{ fontSize: "12px", color: "#666" }}>
          {useDropdown ? "（点击切换为手动输入）" : "（点击切换为下拉选择）"}
        </span>
      </div>
      
      {useDropdown ? (
        <div>
          <select
            value={selectedLevel}
            onChange={(e) => handleLevelChange(e.target.value)}
            style={{ width: "100%", padding: "5px", marginBottom: "5px" }}
          >
            <option value="">选择级别</option>
            <option value="1">级别 1</option>
            <option value="2">级别 2</option>
            <option value="3">级别 3</option>
          </select>
          <select
            value={selectedTeam}
            onChange={(e) => handleTeamChange(e.target.value)}
            disabled={!selectedLevel}
            style={{ width: "100%", padding: "5px" }}
          >
            <option value="">选择球队</option>
            {availableTeams.map((team) => (
              <option key={team.id} value={team.name}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <input
          type="text"
          value={manualInput}
          onChange={(e) => handleManualInputChange(e.target.value)}
          placeholder="手动输入球队名称"
          style={{ width: "100%", padding: "5px" }}
        />
      )}
    </div>
  );
}

