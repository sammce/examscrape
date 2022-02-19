import pandas as pd
from samutil.formatting import Formatter as fmt


def rearrange(db_filename: str):
    try:
        DB = pd.read_json(db_filename)
    except FileNotFoundError:
        print(
            fmt.error(
                f"The JSON file {db_filename} doesn't exist. Did you forget to run the scraper?"
            )
        )

    df = pd.DataFrame(DB)

    years = [index for index in df.index]
    document_types = [col for col in df]

    columns = ["Document Type", "Year", "Examination", "Subject", "Name", "URL"]
    rows = []

    def get_url(SEC_File: str, exam_type: str, year: str):
        return f"https://examinations.ie/archive/{exam_type}/{year}/{SEC_File}"

    # document type > year > exam > subject > {link, name}
    for document_type in document_types:
        for year in years:
            if document_type == "markingschemes" and isinstance(
                df[document_type][year], float
            ):
                continue

            for exam in df[document_type][year]:
                for subject in df[document_type][year][exam]:
                    for item in df[document_type][year][exam][subject]:
                        rows.append(
                            [
                                document_type,
                                year,
                                exam,
                                subject,
                                item["name"],
                                get_url(item["link"], document_type, year),
                            ]
                        )

    ideal_df = pd.DataFrame(columns=columns, data=rows)

    ideal_df.to_csv("ideal_db.csv")


if __name__ == "__main__":
    rearrange("db.json")
