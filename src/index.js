"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const selenium_webdriver_1 = require("selenium-webdriver");
const chrome_1 = __importDefault(require("selenium-webdriver/chrome"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function scrapeAll() {
    const createID = (id) => `MaterialArchive__noTable__sbv__${id}`;
    const screen = {
        width: 1280,
        height: 720,
    };
    const driver = new selenium_webdriver_1.Builder()
        .forBrowser("chrome")
        .setChromeOptions(new chrome_1.default.Options().windowSize(screen))
        .build();
    class Element {
        constructor() {
            this.id = "";
        }
        get options() {
            return (async () => {
                const element = await this.element;
                const options = await element.findElements(selenium_webdriver_1.By.css("option:not(option[value=''])"));
                const values = [];
                for (const option of options) {
                    values.push(await (this.id.endsWith("SubjectSelect")
                        ? option.getText()
                        : option.getAttribute("value")));
                }
                return values;
            })();
        }
        get element() {
            if (this.id === "") {
                throw Error("Child classes of Element must define a non-empty CSS id");
            }
            return driver.findElement(selenium_webdriver_1.By.id(this.id));
        }
        async selectOption(value) {
            const element = await this.element;
            const option = await element.findElement(this.id.endsWith("SubjectSelect")
                ? selenium_webdriver_1.By.xpath(`//*[text()='${value}']`)
                : selenium_webdriver_1.By.css(`option[value='${value}']`));
            await option.click();
            await driver.sleep(200);
        }
        async cycleOptions(onNext) {
            const options = await this.options;
            for (const option of options) {
                await this.selectOption(option);
                await onNext(option);
            }
        }
    }
    class Exam extends Element {
        constructor() {
            super(...arguments);
            this.id = createID("ExaminationSelect");
        }
    }
    class Year extends Element {
        constructor() {
            super(...arguments);
            this.id = createID("YearSelect");
        }
    }
    class Type extends Element {
        constructor() {
            super(...arguments);
            this.id = createID("ViewType");
        }
    }
    class Subject extends Element {
        constructor() {
            super(...arguments);
            this.id = createID("SubjectSelect");
        }
    }
    await driver.get("https://examinations.ie/exammaterialarchive");
    await driver
        .findElement(selenium_webdriver_1.By.id("MaterialArchive__noTable__cbv__AgreeCheck"))
        .click();
    const db = {};
    const type = new Type();
    const year = new Year();
    const exam = new Exam();
    const subject = new Subject();
    await type.cycleOptions(async (typeOption) => {
        db[typeOption] = {};
        await year.cycleOptions(async (yearOption) => {
            db[typeOption][yearOption] = {};
            await exam.cycleOptions(async (examOption) => {
                db[typeOption][yearOption][examOption] = {};
                await subject.cycleOptions(async (subjectOption) => {
                    const linkArr = [];
                    const hiddenFileElements = await driver.findElements(selenium_webdriver_1.By.css("input[type='hidden'][name='fileid']"));
                    const nameElements = await driver.findElements(selenium_webdriver_1.By.css("input[type='hidden'][name='fileid'] + tr > td:first-child"));
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
    fs_1.default.writeFileSync(path_1.default.join(__dirname, "..", "db.json"), JSON.stringify(db));
}
async function scrapeCurrentYear() {
    const currentYear = new Date().getFullYear().toString();
    console.log(typeof fs_1.default.readFileSync(path_1.default.join(__dirname, "..", "db.json")).toString());
}
scrapeCurrentYear();
