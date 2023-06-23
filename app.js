const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");

let db = null;
const initilizeServerAndDB = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Started ...");
    });
  } catch (error) {
    console.log("Server Get An ERROR ${error}");
    process.exit(1);
  }
};

initilizeServerAndDB();

//List Of State API.>>>

app.get("/states/", async (request, response) => {
  const stateQuery = `
        SELECT *
        FROM state;
    `;
  const convertToCamelCase = (eachObj) => {
    return {
      stateId: eachObj.state_id,
      stateName: eachObj.state_name,
      population: eachObj.population,
    };
  };

  const dbResponse = await db.all(stateQuery);
  response.send(dbResponse.map((eachObj) => convertToCamelCase(eachObj)));
});

//State Id Based State Details API.>>>

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;

  const stateQuery = `
        SELECT *
        FROM state
        WHERE state_id = ${stateId};
    `;

  const dbResponse = await db.get(stateQuery);
  response.send({
    stateId: dbResponse.state_id,
    stateName: dbResponse.state_name,
    population: dbResponse.population,
  });
});

// Add New District API.>>>

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const addDistrictQuery = `
    
        INSERT INTO 
            district (district_name,state_id,cases,cured,active,deaths)
        VALUES
            (
                '${districtName}',
                ${stateId},
                ${cases},
                ${cured},
                ${active},
                ${deaths}
            );
    `;

  const dbResponse = await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

// District Id Based District Details API.>>>

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const districtQuery = `
        SELECT *
        FROM district
        WHERE district_id = ${districtId};
    `;

  const dbResponse = await db.get(districtQuery);

  response.send({
    districtId: dbResponse.district_id,
    districtName: dbResponse.district_name,
    stateId: dbResponse.state_id,
    cases: dbResponse.cases,
    cured: dbResponse.cured,
    active: dbResponse.active,
    deaths: dbResponse.deaths,
  });
});

// Delete A District API.>>>

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const deleteQuery = `
    DELETE
    FROM district
    WHERE district_id = ${districtId};
    `;
  const dbResponse = await db.run(deleteQuery);
  response.send("District Removed");
});

// Update A district API.>>>

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const updateDetails = request.body;

  const { districtName, stateId, cases, cured, active, deaths } = updateDetails;

  const updateQuery = `
        UPDATE district
        SET 
            district_name = '${districtName}',
            state_id = ${stateId},
            cases = ${cases},
            cured = ${cured},
            active = ${active},
            deaths = ${deaths}
        WHERE district_id = ${districtId};            
    `;

  const dbResponse = await db.run(updateQuery);
  response.send("District Details Updated");
});

// Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID API.>>>

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;

  const getDetailsQuery = `
        SELECT 
            SUM(cases),SUM(cured),SUM(active),SUM(deaths)
        FROM district
        WHERE state_id = ${stateId};
    `;

  const stats = await db.get(getDetailsQuery);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

//Returns an object containing the state name of a district based on the district ID API.>>>

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;

  const getDistrictQuery = `
        SELECT state_id 
        FROM district 
        WHERE district_id = ${districtId};
    `;
  const getDistrictQueryResponse = await db.get(getDistrictQuery);

  const getStateQuery = `
        SELECT state_name AS stateName
        FROM state
        WHERE state_id = ${getDistrictQueryResponse.state_id};

    `;

  const getStateName = await db.get(getStateQuery);
  response.send(getStateName);
});

module.exports = app;
