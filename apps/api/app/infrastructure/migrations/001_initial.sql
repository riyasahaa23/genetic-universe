CREATE TABLE IF NOT EXISTS genetic_runs (
    run_id VARCHAR(160) PRIMARY KEY,
    request_json TEXT NOT NULL,
    status VARCHAR(32) NOT NULL,
    stage VARCHAR(64) NOT NULL,
    progress DOUBLE PRECISION NOT NULL,
    snapshot_json TEXT,
    trace_json TEXT,
    error_code VARCHAR(128),
    error_message TEXT
);

CREATE TABLE IF NOT EXISTS genetic_events (
    run_id VARCHAR(160) NOT NULL,
    sequence INTEGER NOT NULL,
    event_json TEXT NOT NULL,
    PRIMARY KEY (run_id, sequence),
    FOREIGN KEY (run_id) REFERENCES genetic_runs(run_id)
);

CREATE TABLE IF NOT EXISTS genetic_counterfactuals (
    intervention_id VARCHAR(240) PRIMARY KEY,
    run_id VARCHAR(160) NOT NULL,
    result_json TEXT NOT NULL,
    FOREIGN KEY (run_id) REFERENCES genetic_runs(run_id)
);
