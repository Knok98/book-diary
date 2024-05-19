import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios";
import format from "pg-format";
//________________________________________________________________________________________________________
const app = express();
const scrt = process.env;
const port = scrt.RPORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const db = new pg.Client({
  user: scrt.USER,
  host: scrt.HOST,
  database: scrt.DB,
  password: scrt.PSW,
  port: scrt.DPORT,
});
db.connect();

let currentUser = 1;
//________________________________________________________________________________________________________

app.get("/", async (req, res) => {
  try {
    const litShowCase = await db.query(
      "SELECT * FROM books JOIN users ON books.owner=users.idu WHERE users.idu=$1; ",
      [currentUser]
    );
    res.render("index.ejs", {
      books: litShowCase.rows,
    });
  } catch (err) {
    console.log(err);
  }
});

app.post("/edit/:id", async (req, res) => {
  const bId = parseInt(req.params.id);
  try {
    const litShowCase = await db.query(
      "SELECT * FROM books JOIN users ON books.owner=users.idu WHERE books.id=$1; ",
      [bId]
    );

    res.render("modify.ejs", {
      data: litShowCase.rows[0],
      type: "mod",
    });
  } catch (err) {
    console.log(err);
  }
});

app.post("/new", async (req, res) => {
  const target = req.body.book.trim().replace(/\s/g, "+");
  try {
    const result = await axios.get(
      scrt.GLINK + target + scrt.GAPIK + "&maxResults=1"
    );
    const { data } = result;

    console.log({ data: data.items[0].volumeInfo });
    try {
      const query = {
        text: "INSERT INTO books (title, opinion, rating, owner, isbn, image, authors, description, categories) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
        values: [
          data.items[0].volumeInfo.title,
          "default",
          0,
          currentUser,
          data.items[0].volumeInfo.industryIdentifiers,
          data.items[0].volumeInfo.imageLinks.thumbnail,
          data.items[0].volumeInfo.authors,
          data.items[0].volumeInfo.description,
          data.items[0].volumeInfo.categories,
        ],
      };
      await db.query(query);
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});
app.post("/view/:id", async (req, res) => {
  const bId = parseInt(req.params.id);
  try {
    const litShowCase = await db.query(
      "SELECT * FROM books JOIN users ON books.owner=users.idu WHERE books.id=$1; ",
      [bId]
    );

    res.render("modify.ejs", {
      data: litShowCase.rows[0],
      type: "view",
    });
  } catch (err) {
    console.log(err);
  }
});

app.post("/update", async (req, res) => {
  const target = req.body;
  console.log(target);
  try {
    const result = await db.query(
      "UPDATE books SET opinion=$1, rating=$2, sub_date=$3 WHERE books.id=$4; ",
      [target.content, parseInt(target.stars), new Date(), parseInt(target.id)]
    );
    res.redirect("/");
  } catch (err) {
    console.log(err);
  }
});

app.post("/delete/:id", (req, res) => {
  const bId = req.params.id;
  try {
    const result = db.query("DELETE FROM books WHERE id=$1; ", [bId]);
    res.redirect("/");
  } catch (err) {
    console.log(err);
  }
});

app.post("/sort", async (req, res) => {
  const data = req.body;
  console.log(data);
  try {
    let query = format(
      "SELECT * FROM books JOIN users ON books.owner=users.idu WHERE  users.idu= %L ORDER BY %I %s",
      currentUser,
      req.body.type,
      req.body.asds
    );
    const result = await db.query(query);
    res.render("index.ejs", {
      books: result.rows,
    });
  } catch (err) {
    console.log(err);
  }
});

//________________________________________________________________________________________________________
app.listen(port, () => {
  console.log(`Server running on port ${port}...`);
});
