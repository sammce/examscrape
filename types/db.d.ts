type Examinations = "lc" | "jc" | "lv";
type DocumentTypes = "markingschemes" | "exampapers";

// I would use manually entered values for years,
// but I would then have to update yearly
type Year = string;
// Same for subjects
type Subject = string;

/**
 * This is the ideal format of the data for UX.
 */
export interface IdealDB {
  [Exam in Examinations]: {
    [index: Subject]: {
      [index: Year]: {
        [Type in DocumentTypes]: [
          {
            link: string;
            name: string;
          }
        ];
      };
    };
  };
}

/**
 * This is the format of the data from examinations.ie without modification.
 */
export type ScrapedDB = {
  [key in DocumentTypes]: {
    [index: Year]: {
      [key in Examinations]: {
        [index: Subject]: [
          {
            link: string;
            name: string;
          }
        ];
      };
    };
  };
};
