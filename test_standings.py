import json

def test_logic():
    # Simulate computeStandings
    LEAGUE_STAGES = {"league", "group"}
    
    matches = [
        {"team_a_id": "t1", "team_b_id": "t2", "score_a": 10, "score_b": 5, "status": "completed", "stage": "league"},
        {"team_a_id": "t2", "team_b_id": "t1", "score_a": 8, "score_b": 12, "status": "completed", "stage": "league"},
        {"team_a_id": "t1", "team_b_id": "t2", "score_a": None, "score_b": None, "status": "scheduled", "stage": "league"}
    ]
    
    teams = [{"id": "t1", "name": "Team 1"}, {"id": "t2", "name": "Team 2"}]
    
    # Standings calculation logic check
    stats = {t["id"]: {"wins": 0, "losses": 0, "played": 0} for t in teams}
    for m in matches:
        if m["stage"] not in LEAGUE_STAGES: continue
        if m["score_a"] is None or m["score_b"] is None: continue
        stats[m["team_a_id"]]["played"] += 1
        stats[m["team_b_id"]]["played"] += 1
        if m["score_a"] > m["score_b"]:
            stats[m["team_a_id"]]["wins"] += 1
            stats[m["team_b_id"]]["losses"] += 1
        else:
            stats[m["team_b_id"]]["wins"] += 1
            stats[m["team_a_id"]]["losses"] += 1
            
    print(json.dumps(stats))

test_logic()
