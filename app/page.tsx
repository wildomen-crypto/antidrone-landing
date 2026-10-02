export default function HomePage() {
  return (
    <div className="page-shell">
      <header className="site-header">
        <span className="brand">Металлоконструкции</span>
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

        <a className="company-link" href="https://topengineer.ru/">
          Основной сайт компании <span aria-hidden="true">↗</span>
        </a>
      </main>

      <footer className="site-footer">
        <span>Основа проекта</span>
        <span>Блок B01.1</span>
      </footer>
    </div>
  );
}
