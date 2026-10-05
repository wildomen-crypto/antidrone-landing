import Image from "next/image";
import { sitePath } from "@/lib/site-path";
import { shapes } from "@/config/catalog";
import type { ShapeId } from "@/lib/configuration/schema";

type Example = Readonly<{
  image: string;
  title: string;
  description: string;
  alt: string;
}>;

const examples = {
  C1: {
    image: "/images/portfolio/linear-screen.png",
    title: "Экран вдоль технологической площадки",
    description: "Стальные стойки и сетчатое заполнение вдоль оборудования. Линейный контур оставляет доступ к площадке с других сторон.",
    alt: "Концепция линейного стального экрана с сеткой вдоль промышленного оборудования",
  },
  C2: {
    image: "/images/portfolio/perimeter.png",
    title: "Сетчатый контур вокруг оборудования",
    description: "Ограждение по четырём сторонам с проёмом для обслуживания. Верх остаётся открытым, стороны можно настроить отдельно.",
    alt: "Концепция прямоугольного сетчатого ограждения с открытым верхом вокруг оборудования",
  },
  C3: {
    image: "/images/portfolio/canopy.png",
    title: "Навес над технологическим блоком",
    description: "Пространственные фермы и сетчатое покрытие на отдельно стоящих опорах. Боковые стороны открыты для доступа к оборудованию.",
    alt: "Концепция защитного металлического навеса с сетчатой кровлей и открытыми боковыми сторонами",
  },
  C4: {
    image: "/images/refinery-protection-concept.png",
    title: "Укрытие объектов нефтепереработки",
    description: "Металлический каркас над резервуарами и трубопроводами. Сетка закрывает верх и боковые поверхности укрытия.",
    alt: "Концепция нефтеперерабатывающей площадки под металлическими фермами и защитными сетками",
  },
  C5: {
    image: "/images/portfolio/facade-canopy.png",
    title: "Козырёк вдоль промышленного корпуса",
    description: "Кронштейны и сетчатое покрытие вдоль существующей стены. В конфигураторе доступны пристенный экран и козырёк.",
    alt: "Концепция пристенного сетчатого козырька на стальных кронштейнах у промышленного здания",
  },
  C6: {
    image: "/images/portfolio/gallery.png",
    title: "Галерея над технологическим проездом",
    description: "Повторяющиеся арочные пролёты с сетчатым заполнением. Проезд сохраняет открытый въезд и выезд; форма галереи выбирается в 3D.",
    alt: "Концепция протяжённой арочной галереи с сеткой над проездом на промышленной площадке",
  },
  C7: {
    image: "/images/portfolio/round-dome.png",
    title: "Круглое укрытие резервуара",
    description: "Опоры по окружности и радиальное сетчатое покрытие. Диаметр, высота и подъём покрытия задаются под габариты объекта.",
    alt: "Концепция круглого защитного укрытия с радиальными фермами и сетчатым шатром над резервуаром",
  },
  C8: {
    image: "/images/portfolio/complex-enclosure.png",
    title: "Укрытие с несколькими контурами",
    description: "Несколько независимых каркасов вокруг технологического блока. Для каждого контура можно задать высоту, отступы и заполнение.",
    alt: "Концепция промышленного оборудования внутри нескольких вложенных металлических каркасов с сетками",
  },
} satisfies Record<ShapeId, Example>;

export default function Portfolio() {
  return (
    <section className="section portfolio-section" id="portfolio" aria-labelledby="portfolio-heading">
      <div className="container">
        <div className="section-heading">
          <div>
            <p className="eyebrow">От 3D-схемы к облику объекта</p>
            <h2 id="portfolio-heading">Примеры возможной<br />реализации защиты</h2>
          </div>
          <p>Восемь типов конструкций из нашего конфигуратора — в промышленной среде. Выберите подходящую форму и настройте её под свой объект.</p>
        </div>
        <p className="portfolio-note">Изображения созданы как визуальные концепции, а не фотографии выполненных работ. Конструктивное решение и характеристики защиты определяются при проектировании.</p>
        <div className="portfolio-grid">
          {shapes.map(shape => {
            const example = examples[shape.id];
            return (
              <article className="portfolio-card" key={shape.id} data-shape={shape.id}>
                <a className="portfolio-image" href={sitePath(example.image)} target="_blank" rel="noopener noreferrer" aria-label={`Открыть изображение: ${example.title}`}>
                  <Image src={sitePath(example.image)} alt={example.alt} fill sizes="(max-width: 767px) calc(100vw - 32px), (min-width: 1600px) 700px, (min-width: 1304px) 608px, calc((100vw - 88px) / 2)" quality={80} />
                  <span className="portfolio-badge">Визуальная концепция</span>
                  <span className="portfolio-expand" aria-hidden="true">↗</span>
                </a>
                <div className="portfolio-copy">
                  <h3>{example.title}</h3>
                  <p>{example.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
