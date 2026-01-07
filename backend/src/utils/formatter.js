function formatForBudget(application) {
  const parts = [
    String(application.team_out || ""),
    String(application.team_in || ""),
    String(application.price || ""),
    String(application.player1 || "")
  ];

  // Add optional players (2-4) if they exist
  if (application.player2 && application.player2.trim()) {
    parts.push(String(application.player2));
  }
  if (application.player3 && application.player3.trim()) {
    parts.push(String(application.player3));
  }
  if (application.player4 && application.player4.trim()) {
    parts.push(String(application.player4));
  }

  // Filter out empty parts and join with comma
  return parts.filter(p => p && p.trim()).join(",");
}

module.exports = { formatForBudget };

