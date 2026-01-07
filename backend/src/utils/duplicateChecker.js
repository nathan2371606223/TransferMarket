function checkDuplicates(application, existingRecords) {
  const matches = [];
  const appPrice = Number(application.price);
  const appFields = {
    player1: (application.player1 || "").trim().toLowerCase(),
    player2: (application.player2 || "").trim().toLowerCase(),
    player3: (application.player3 || "").trim().toLowerCase(),
    player4: (application.player4 || "").trim().toLowerCase(),
    team_out: (application.team_out || "").trim().toLowerCase(),
    team_in: (application.team_in || "").trim().toLowerCase(),
    remarks: (application.remarks || "").trim().toLowerCase()
  };

  for (const record of existingRecords) {
    if (record.archived) continue; // Skip archived records

    const recordPrice = Number(record.price);
    if (recordPrice !== appPrice) continue; // Price must match

    let matchCount = 0;
    const recordFields = {
      player1: (record.player1 || "").trim().toLowerCase(),
      player2: (record.player2 || "").trim().toLowerCase(),
      player3: (record.player3 || "").trim().toLowerCase(),
      player4: (record.player4 || "").trim().toLowerCase(),
      team_out: (record.team_out || "").trim().toLowerCase(),
      team_in: (record.team_in || "").trim().toLowerCase(),
      remarks: (record.remarks || "").trim().toLowerCase()
    };

    // Count matching fields (excluding price which is already checked)
    if (appFields.player1 && appFields.player1 === recordFields.player1) matchCount++;
    if (appFields.player2 && appFields.player2 === recordFields.player2) matchCount++;
    if (appFields.player3 && appFields.player3 === recordFields.player3) matchCount++;
    if (appFields.player4 && appFields.player4 === recordFields.player4) matchCount++;
    if (appFields.team_out && appFields.team_out === recordFields.team_out) matchCount++;
    if (appFields.team_in && appFields.team_in === recordFields.team_in) matchCount++;
    if (appFields.remarks && appFields.remarks === recordFields.remarks) matchCount++;

    if (matchCount >= 3) {
      matches.push(record);
    }
  }

  return matches;
}

module.exports = { checkDuplicates };

