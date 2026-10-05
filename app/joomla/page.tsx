import LandingPage from "@/components/landing/LandingPage";
import JoomlaBridge from "@/components/joomla/JoomlaBridge";
import "./monday.css";

export default function JoomlaPage() {
  return <>
    <link rel="stylesheet" href="https://topengineer.ru/templates/yoo_monday/css/custom.css" />
    <LandingPage calculatorVariant="overlay" embedded />
    <JoomlaBridge />
  </>;
}
