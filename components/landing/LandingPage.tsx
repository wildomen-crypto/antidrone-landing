import { company } from "@/config/company";
import { shapes } from "@/config/catalog";
import { defaultInput } from "@/lib/configuration/input";
import { generateModel } from "@/lib/geometry/generate";
import { ModelDiagram } from "@/components/viewer/ModelDiagram";
import Calculator from "@/components/calculator/Calculator";
import ChooseShape from "@/components/landing/ChooseShape";
import Portfolio from "@/components/landing/Portfolio";
import Materials from "@/components/landing/Materials";
import LeadForm from "@/components/landing/LeadForm";
import { sitePath } from "@/lib/site-path";

export default function LandingPage({ calculatorVariant = "standard", embedded = false }: { calculatorVariant?: "standard" | "wide" | "compact" | "overlay"; embedded?: boolean }) {
  return <>
    <a className="skip-link" href="#main-content">Перейти к содержанию</a>
    {!embedded && <header className="site-header"><div className="container header-inner">
      <a className="brand" href={sitePath("/")} aria-label={company.shortName + " — на главную"}><span className="brand-mark" aria-hidden="true">Т</span><span>{company.shortName}<small>Инженерные конструкции</small></span></a>
      <nav aria-label="Основная навигация"><a href="#solutions">Решения</a><a href="#calculator">3D-конфигуратор</a><a href="#portfolio">Примеры</a><a href="#contacts">Заказать проект</a></nav>
      <a className="header-phone" href={company.contacts.general.phone.href}>{company.contacts.general.phone.display}<small>Обсудить проект</small></a>
    </div></header>}
    <main id="main-content" className={embedded ? "joomla-content" : undefined}>
      <section className="section" id="calculator"><div className="container"><div className="section-heading"><div><h1>Проектирование металлоконструкций для антидроновой защиты</h1></div><p>Проектируем каркасы, защитные экраны и укрытия под размеры вашего объекта. От предварительной 3D-компоновки до рабочей документации КМ, КМД и КЖ.</p></div></div>{calculatorVariant === "wide" ? <Calculator variant="wide" /> : <div className="container"><Calculator variant={calculatorVariant} /></div>}</section>
      <section className="section section-tint" id="solutions"><div className="container"><div className="section-heading"><div><p className="eyebrow">Конструктивные решения</p><h2>Подберите форму<br />для вашего объекта</h2></div><p>От отдельного экрана до нескольких защитных контуров. Начните с формы — размеры и заполнение можно изменить в конфигураторе.</p></div><div className="solution-grid">{shapes.map((shape, i) => {
        const graph = generateModel({ ...structuredClone(defaultInput), shapeId: shape.id, length: 5, width: 3, height: 2.8, diameter: 4, rise: 1, materialId: "M4", roofMaterialId: "M6", variant: shape.id === "C5" ? "shelter" : shape.id === "C6" ? "arch" : shape.id === "C7" ? "dome" : "portal", contours: [{ enabled: true, offset: 0.5, height: 3.3 }, { enabled: true, offset: 1.2, height: 4 }, { enabled: false, offset: 2, height: 5 }] });
        return <article className="solution-card" key={shape.id}><div className="solution-image"><span className="card-index">0{i + 1}</span><ModelDiagram graph={graph} paddingRatio={.035} /></div><h3>{shape.name}</h3><ChooseShape shapeId={shape.id} label={shape.description} /></article>;
      })}</div></div></section>
      <Portfolio />

      <Materials />
      <section className="section container documents-section"><div><p className="eyebrow">Документы по согласованному объёму</p><h2>Понятный состав проекта</h2><p>Перечень выдаваемой документации зависит от вашего заказа и фиксируется до начала работ.</p></div><div className="document-grid">{[["КМ", "Схемы и конструктивные решения"], ["КМД", "Чертежи для изготовления"], ["Ведомости", "Элементы, материалы и комплектующие"], ["КЖ", "Железобетонные конструкции и фундаменты"]].map(([a, b]) => <div key={a}><strong>{a}</strong><span>{b}</span></div>)}</div></section>
      <section className="section section-tint" id="process"><div className="container"><p className="eyebrow">Как мы работаем</p><h2>Четыре шага к готовому проекту</h2><div className="process-grid">{[["Заявка и размеры", "Пришлите задачу или соберите предварительную схему."], ["Уточнение решения", "Инженер проверит исходные данные и состав работ."], ["Предложение и проект", "Согласуем стоимость, документацию и условия выполнения."], ["Выдача документации", "Передаём согласованные разделы проекта, чертежи и спецификации."]].map(([t, d], i) => <article key={t}><span>0{i + 1}</span><h3>{t}</h3><p>{d}</p></article>)}</div></div></section>
      <section className="section container contacts-section" id="contacts"><div className="contact-copy"><p className="eyebrow">Начнём с вашей задачи</p><h2>Обсудим конструкцию<br />и состав работ</h2><a className="contact-phone" href={company.contacts.general.phone.href}>{company.contacts.general.phone.display}</a><a className="contact-email" href={company.contacts.general.email.href}>{company.contacts.general.email.address}</a><div className="contact-departments"><div><strong>{company.contacts.design.label}</strong><a href={company.contacts.design.phone.href}>{company.contacts.design.phone.display}</a><a href={company.contacts.design.email.href}>{company.contacts.design.email.address}</a></div></div><address>{company.officeAddress}</address><p className="contact-hours">{company.workingHours.display}<br />Время московское</p></div><LeadForm variant="contact" /></section>
    </main>
    {!embedded && <><footer className="site-footer"><div className="container"><div className="footer-top"><a className="brand" href={sitePath("/")}>{company.shortName}</a><p>Проектирование металлоконструкций<br />Разработка КМ, КМД и КЖ</p><a href={company.websiteUrl}>Основной сайт ↗</a></div><div className="footer-bottom"><p>{company.publishedLegalEntity.name} · ИНН {company.publishedLegalEntity.inn} · ОГРН {company.publishedLegalEntity.ogrn}</p><div><a href={sitePath("/privacy/")}>Политика обработки данных</a><a href={sitePath("/consent/")}>Согласие на обработку</a></div></div><p className="footer-note">3D-схемы служат для предварительной компоновки. Окончательное конструктивное решение и состав документации определяются проектом и договором.</p></div></footer>
    <div className="mobile-actions"><a href={company.contacts.general.phone.href}>Позвонить</a><a href="#calculator">Собрать 3D-схему ↗</a></div></>}
  </>;
}
