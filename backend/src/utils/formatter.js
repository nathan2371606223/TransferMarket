function formatForBudget(application) {
  const parts = [
    application.team_out || "",
    application.team_in || "",
    application.price || "",
    application.player1 || ""
  ];

  // Add optional players (2-4) if they exist
  if (application.player2) parts.push(application.player2);
  if (application.player3) parts.push(application.player3);
  if (application.player4) parts.push(application.player4);

  // Filter out empty parts and join with comma
  return parts.filter(Boolean).join(",");
}

module.exports = { formatForBudget };

