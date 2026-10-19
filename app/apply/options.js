/**
 * Shared options for the ExeHacks 2027 hacker application (/apply).
 * Imported by the form (app/components/ApplyForm) and by the Worker (worker/apply.js),
 * so the allowed values are checked against the same lists on both sides.
 * Level of study and the MLH checkbox wording follow the MLH registration guidelines:
 * https://guide.mlh.com/general-information/managing-registrations/registrations
 */

export const OPENS_LABEL = "Mon 9 Nov 2026"

// ExeHacks is 18+ only (age on Sat 6 Feb 2027).
export const MIN_AGE = 18
export const AGE_MESSAGE = "ExeHacks is open to people aged 18+ on 6 Feb 2027."
// Dropdown values. MLH asks for a specific age rather than a date of birth.
export const AGES = Array.from({ length: 30 - MIN_AGE + 1 }, (_, i) => String(MIN_AGE + i)).concat(["31+"])

export const LEVELS_OF_STUDY = [
	"Less than Secondary / High School",
	"Secondary / High School",
	"Undergraduate University (2 year - community college or similar)",
	"Undergraduate University (3+ year)",
	"Graduate University (Masters, Professional, Doctoral, etc)",
	"Code School / Bootcamp",
	"Other Vocational / Trade Program or Apprenticeship",
	"Post Doctorate",
	"Other",
	"I’m not currently a student",
	"Prefer not to answer"
]

// Suggestions only (exact names from the MLH verified schools list). Free text is allowed.
export const SCHOOL_SUGGESTIONS = [
	"University of Exeter",
	"University of Bristol",
	"University of Bath",
	"University of Plymouth",
	"University of the West of England",
	"Falmouth University",
	"Plymouth Marjon University",
	"Bath Spa University",
	"Cardiff University",
	"Swansea University",
	"University of Southampton",
	"Bournemouth University",
	"Arts University Bournemouth",
	"University of Reading",
	"University of Surrey",
	"University of Sussex",
	"University of Oxford",
	"University of Cambridge",
	"Imperial College London",
	"University College London",
	"King's College London - University of London",
	"Queen Mary University of London",
	"Royal Holloway - University of London",
	"Brunel University London",
	"University of Warwick",
	"University of Birmingham",
	"Aston University",
	"Loughborough University",
	"University of Nottingham",
	"University of Leicester",
	"University of Leeds",
	"University of York",
	"Durham University",
	"Newcastle University",
	"Lancaster University",
	"University of Liverpool",
	"University of Glasgow",
	"Heriot-Watt University",
	"University of Kent",
	"Open University"
]

// ISO 3166 short names (en-GB). United Kingdom is pinned to the top in the form.
export const HOME_COUNTRY = "United Kingdom"
export const COUNTRIES = [HOME_COUNTRY, ...["Afghanistan","Åland Islands","Albania","Algeria","American Samoa","Andorra","Angola","Anguilla","Antarctica","Antigua & Barbuda","Argentina","Armenia","Aruba","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bermuda","Bhutan","Bolivia","Bosnia & Herzegovina","Botswana","Bouvet Island","Brazil","British Indian Ocean Territory","British Virgin Islands","Brunei","Bulgaria","Burkina Faso","Burundi","Cambodia","Cameroon","Canada","Cape Verde","Caribbean Netherlands","Cayman Islands","Central African Republic","Chad","Chile","China","Christmas Island","Cocos (Keeling) Islands","Colombia","Comoros","Congo - Brazzaville","Congo - Kinshasa","Cook Islands","Costa Rica","Côte d’Ivoire","Croatia","Cuba","Curaçao","Cyprus","Czechia","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia","Falkland Islands","Faroe Islands","Fiji","Finland","France","French Guiana","French Polynesia","French Southern Territories","Gabon","Gambia","Georgia","Germany","Ghana","Gibraltar","Greece","Greenland","Grenada","Guadeloupe","Guam","Guatemala","Guernsey","Guinea","Guinea-Bissau","Guyana","Haiti","Heard & McDonald Islands","Honduras","Hong Kong SAR China","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Isle of Man","Israel","Italy","Jamaica","Japan","Jersey","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Macao SAR China","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Martinique","Mauritania","Mauritius","Mayotte","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Montserrat","Morocco","Mozambique","Myanmar (Burma)","Namibia","Nauru","Nepal","Netherlands","New Caledonia","New Zealand","Nicaragua","Niger","Nigeria","Niue","Norfolk Island","North Korea","North Macedonia","Northern Mariana Islands","Norway","Oman","Pakistan","Palau","Palestinian Territories","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Pitcairn Islands","Poland","Portugal","Puerto Rico","Qatar","Réunion","Romania","Russia","Rwanda","Samoa","San Marino","São Tomé & Príncipe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Sint Maarten","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Georgia & South Sandwich Islands","South Korea","South Sudan","Spain","Sri Lanka","St Barthélemy","St Helena","St Kitts & Nevis","St Lucia","St Martin","St Pierre & Miquelon","St Vincent & the Grenadines","Sudan","Suriname","Svalbard & Jan Mayen","Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tokelau","Tonga","Trinidad & Tobago","Tunisia","Türkiye","Turkmenistan","Turks & Caicos Islands","Tuvalu","Uganda","Ukraine","United Arab Emirates","United States","Uruguay","US Outlying Islands","US Virgin Islands","Uzbekistan","Vanuatu","Vatican City","Venezuela","Vietnam","Wallis & Futuna","Western Sahara","Yemen","Zambia","Zimbabwe"]]

export const TSHIRT_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"]

export const HACKATHONS_ATTENDED = [
	{ value: "0", label: "None, this would be my first" },
	{ value: "1-2", label: "1 to 2" },
	{ value: "3+", label: "3 or more" },
]

export const EXPERIENCE_LEVELS = [
	{ value: "beginner", label: "Beginner: new to coding or just getting started" },
	{ value: "intermediate", label: "Intermediate: built a few projects" },
	{ value: "advanced", label: "Advanced: comfortable shipping full projects" },
]

export const TEAM_STATUSES = [
	{ value: "have_team", label: "I already have a team" },
	{ value: "looking", label: "I’m looking for a team" },
	{ value: "solo", label: "I’d rather work solo" },
]

export const HEARD_FROM = ["Fixr", "Luma", "Instagram", "Discord", "LinkedIn", "Friend", "Lecturer", "EXCS", "MLH", "Poster or flyer", "Other"]

export const APPLICATION_STATUSES = ["pending", "accepted", "waitlisted", "rejected", "confirmed", "declined"]

export const MLH_LINKS = {
	codeOfConduct: "https://github.com/MLH/mlh-policies/blob/main/code-of-conduct.md",
	contestTerms: "https://github.com/MLH/mlh-policies/blob/main/contest-terms.md",
	privacyPolicy: "https://github.com/MLH/mlh-policies/blob/main/privacy-policy.md",
}

export const GRADUATION_YEARS = Array.from({ length: 9 }, (_, i) => String(2026 + i))

// Countdown target on the closed /apply page: Mon 9 Nov 2026, 12:00 UK time.
// The UK is on GMT in November, so 12:00 London = 12:00 UTC.
// This only drives the clock. The form opens when the Worker var APPLICATIONS_OPEN is "true".
export const OPENS_AT_ISO = "2026-11-09T12:00:00Z"
export const OPENS_AT = Date.parse(OPENS_AT_ISO)
export const OPENS_TIME_LABEL = "12:00 UK time"
