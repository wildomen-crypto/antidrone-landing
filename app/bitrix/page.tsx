import LandingPage from "@/components/landing/LandingPage";
import JoomlaBridge from "@/components/joomla/JoomlaBridge";
import "../joomla/monday.css";
import "./bitrix.css";

// The adapter supplies host typography and transport. No Joomla or Bitrix template CSS is imported.
export default function BitrixArticlePage() {
  return <><LandingPage calculatorVariant="overlay" embedded /><JoomlaBridge /></>;
}
