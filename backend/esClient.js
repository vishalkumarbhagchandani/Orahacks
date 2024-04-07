const { Client } = require("@elastic/elasticsearch");

const client = new Client({
  cloud: {
    id: "OrahacksUML:dXMtY2VudHJhbDEuZ2NwLmNsb3VkLmVzLmlvJDFhMWE4NDM1YzBkZDQwNzZhZDhmYTQ3NjEwMDRjMjQwJDlhZGViMTBmY2VmNDRhMGY5MGJmYWQ1YmM1NjY5OTM5",
  },
  auth: {
    username: "elastic",
    password: "mnW4lUeAdMDkO3Qwd3vRjMN8",
  },
});

module.exports = client;
