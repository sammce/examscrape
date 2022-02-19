Simple NodeJS / Python project for scraping examination material data from the [SEC Exam Material Archive](https://examinations.ie/exammaterialarchive).

To clone the project, in your console type:
```sh
git clone https://github.com/sammce/examscrape.git
cd examscrape
```

Install dependencies using:
```sh
pnpm install
// or
yarn install
// or
npm install
```

**Note**: You must have selenium's Chrome driver installed and available on your systems PATH.

To run the scraper, use:
```sh
pnpm main
// or 
yarn main
// or
npm run main
```
This will compile the TypeScript file to JavaScript and run it.
It may take a while for the scraper to finish, as there is an artificial delay between each dropdown selection to avoid issuing too many requests, resulting in a 429 HTTP error.

The format the resulting data (located in `db.json`) is in is unsuitable for the site, so a Python script is used to rearrange it.

To setup the Python environment, preferably in a venv, use:
```sh
pip install -r requirements.txt
```

Then run:
```sh
python rearrange.py
// Or on UNIX systems
python3 rearrange.py
```

This will only work if `db.json` is present in the current working directory.

The resulting CSV file (`ideal_db.csv`) is what will be used in the finished site.
