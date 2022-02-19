import { Builder, By } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome";
import fs from "fs";
import path from "path";
import type { ScrapedDB } from "../types/db";

const createID = (id: string) => `MaterialArchive__noTable__sbv__${id}`;

const screen = {
  width: 1280,
  height: 720,
};

const driver = new Builder()
  .forBrowser("chrome")
  .setChromeOptions(new chrome.Options().windowSize(screen))
  .build();

class Element {
  id = "";

  /**
   * Find all option children of the dropdown element
   * with a valid value.
   */
  get options() {
    return (async () => {
      const element = await this.element;

      const options = await element.findElements(
        By.css("option:not(option[value=''])")
      );

      const values: string[] = [];

      for (const option of options) {
        values.push(
          await (this.id.endsWith("SubjectSelect")
            ? option.getText()
            : option.getAttribute("value"))
        );
      }

      return values;
    })();
  }

  /**
   * Fetches the 'select' element from the DOM using the child's ID.
   */
  get element() {
    if (this.id === "") {
      throw Error("Child classes of Element must define a non-empty CSS id");
    }

    return driver.findElement(By.id(this.id));
  }

  /**
   * Select an option of the dropdown using its value.
   * This triggers a refresh on the page, so there is a delay
   * to prevent 429 Error.
   */
  async selectOption(value: string) {
    const element = await this.element;

    const option = await element.findElement(
      this.id.endsWith("SubjectSelect")
        ? By.xpath(`//*[text()='${value}']`)
        : By.css(`option[value='${value}']`)
    );

    await option.click();
    await driver.sleep(200);
  }

  /**
   * Loop through each option in the dropdown, select it and call a
   * callback so the value can be stored.
   */
  async cycleOptions(onNext: (option: string) => Promise<unknown>) {
    const options = await this.options;

    for (const option of options) {
      await this.selectOption(option);
      await onNext(option);
    }
  }
}

class Exam extends Element {
  id = createID("ExaminationSelect");
}

class Year extends Element {
  id = createID("YearSelect");
}

class Type extends Element {
  id = createID("ViewType");
}

class Subject extends Element {
  id = createID("SubjectSelect");
}

async function scrape({ currentYear = false }: { currentYear?: boolean }) {
  // Navigate to site and agree to terms
  await driver.get("https://examinations.ie/exammaterialarchive");
  await driver
    .findElement(By.id("MaterialArchive__noTable__cbv__AgreeCheck"))
    .click();

  const db = currentYear
    ? JSON.parse(
        fs.readFileSync(path.join(__dirname, "..", "db.json")).toString()
      )
    : {};

  const type = new Type();
  const year = new Year();
  const exam = new Exam();
  const subject = new Subject();

  await type.cycleOptions(async typeOption => {
    !currentYear && (db[typeOption] = {});

    await year.cycleOptions(async yearOption => {
      // If the scraper is only getting the current year, skip all years
      // in dropdowns that aren't that year to save time.
      if (currentYear && new Date().getFullYear().toString() !== yearOption)
        return;
      else db[typeOption][yearOption] = {};

      await exam.cycleOptions(async examOption => {
        !currentYear && (db[typeOption][yearOption][examOption] = {});

        await subject.cycleOptions(async subjectOption => {
          const linkArr: { link: string; name: string }[] = [];

          // The links to each document are stored in the value
          // of a hidden input
          const hiddenFileElements = await driver.findElements(
            By.css("input[type='hidden'][name='fileid']")
          );

          const nameElements = await driver.findElements(
            By.css("input[type='hidden'][name='fileid'] + tr > td:first-child")
          );

          for (let i = 0; i < hiddenFileElements.length; ++i) {
            const hiddenFileElement = hiddenFileElements[i];
            const nameElement = nameElements[i];

            linkArr.push({
              link: await hiddenFileElement.getAttribute("value"),
              name: await nameElement.getText(),
            });
          }

          db[typeOption][yearOption][examOption][subjectOption] = linkArr;
        });
      });
    });
  });

  fs.writeFileSync(path.join(__dirname, "..", "db.json"), JSON.stringify(db));
}

scrape({ currentYear: true });
