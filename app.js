const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
let db = null;

const dbPath = path.join(__dirname, "covid19India.db");

const initializeServerAndDb = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }

  app.listen(3003, () => console.log("Server started at localHost 3003"));
};

initializeServerAndDb();

const CamelCaseConvertor = (dbObj) => {
  return {
    stateId: dbObj.state_id,
    stateName: dbObj.state_name,
    population: dbObj.population,
  };
};

const CamelCaseConvertor2 = (dbObj) => {
  return {
    districtId: dbObj.district_id,
    districtName: dbObj.district_name,
    stateId: dbObj.state_id,
    cases: dbObj.cases,
    cured: dbObj.cured,
    active: dbObj.active,
    deaths: dbObj.deaths,
  };
};

//Get all the states
app.get("/states/", async (req, res) => {
  const getAll = `SELECT * FROM STATE`;
  const result = await db.all(getAll);
  res.send(result.map((eachState) => CamelCaseConvertor(eachState)));
});

app.get("/states/:stateId", async (req, res) => {
  const { stateId } = req.params;
  const getSingle = `SELECT * FROM STATE where state_id=${stateId}`;
  const result = await db.get(getSingle);
  res.send(CamelCaseConvertor(result));
});

app.use(express.json());

app.post("/districts/", async (req, res) => {
  const { districtName, stateId, cases, cured, active, deaths } = req.body;
  const insertSQLQuery = `INSERT INTO 
  District(district_name, state_id, cases, cured, active, deaths)
  VALUES( '${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths})`;
  await db.run(insertSQLQuery);
  res.send("District Successfully Added");
});

app.get("/districts/:districtId", async (req, res) => {
  const { districtId } = req.params;
  const getSingle = `SELECT * FROM district where district_id=${districtId}`;
  const result = await db.get(getSingle);
  res.send(CamelCaseConvertor2(result));
});

app.delete("/districts/:districtId", async (req, res) => {
  const { districtId } = req.params;
  const deleteSQLQuery = `DELETE FROM district where district_id=${districtId}`;
  await db.get(deleteSQLQuery);
  res.send("District Removed");
});

app.put("/districts/:districtId", async (req, res) => {
  const { districtId } = req.params;
  const { districtName, stateId, cases, cured, active, deaths } = req.body;
  const putSQLQuery = `UPDATE district 
  SET district_name='${districtName}',
  state_id=${stateId},
  cases=${cases}, cured=${cured}, active=${active}, deaths=${deaths}
  where district_id=${districtId}`;
  await db.get(putSQLQuery);
  res.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (req, res) => {
  const { stateId } = req.params;
  const statsQuery = `
  SELECT SUM(cases), SUM(cured), SUM(active), SUM(deaths) 
  FROM DISTRICT WHERE state_id=${stateId}`;
  const result = await db.get(statsQuery);
  console.log(result);
});

app.get("/districts/:districtId/details/", async (req, res) => {
  const { districtId } = req.params;
  const getQuery = `SELECT state_name FROM STATE INNER JOIN DISTRICT where district_id=${districtId}`;
  const result = await db.get(getQuery);
  res.send({ stateName: result.state_name });
});

module.exports = app;
