const express = require("express");
const app = express();

const PORT = 3000;

app.listen(PORT, () => {
  console.log(
    "server has started sucessfully at PORT: ",
    PORT,
    " ",
    new Date().toLocaleString(),
  );
});
