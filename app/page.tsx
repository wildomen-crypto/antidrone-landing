import { company } from "@/config/company";

export default function HomePage() {
  return (
    <div className="page-shell">
      <header className="site-header">
        <span className="brand">{company.shortName}</span>
        <span className="preview-label">Локальная версия</span>
      </header>

      <main id="main-content">
        <p className="eyebrow">Проектирование · Изготовление · Монтаж</p>
        <h1>Защитные<br />металлоконструкции</h1>
        <p className="intro">
          Каркасы и ограждающие конструкции под размеры вашего объекта.
        </p>

        <div className="preview-note">
          <span className="status-dot" aria-hidden="true" />
          <p>
            Начальная версия проекта. Каталог решений и калькуляторы
            появятся на следующих этапах.
          </p>
        </div>

        <a className="company-link" href={company.websiteUrl}>
          Основной сайт компании <span aria-hidden="true">↗</span>
        </a>
      </main>

      <footer className="site-footer">
        <a href={company.contacts.general.phone.href}>
          {company.contacts.general.phone.display}
        </a>
        <a href={company.contacts.general.email.href}>
          {company.contacts.general.email.address}
        </a>
      </footer>
    </div>
  );
}
