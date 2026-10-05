import Image from "next/image";
import { materials } from "@/config/catalog";
import { materialPhotos } from "@/config/material-photos";
import { sitePath } from "@/lib/site-path";

export default function Materials() {
  return <section className="section section-tint material-photo-section" id="materials">
    <div className="container">
      <div className="section-heading">
        <div><p className="eyebrow">Заполнение и комплектующие</p><h2>От сетчатого полотна<br />до стальных труб</h2></div>
        <p>Материал выбирается под проект. Характеристики и крепления согласуются по документам производителя. Изображения — фотореалистичные визуализации.</p>
      </div>
      <div className="material-grid">{materials.map(material => {
        const photo = materialPhotos[material.id];
        return <article key={material.id} className="material-card">
          <figure className="material-photo">
            <div className="material-photo-frame">
              <a href={sitePath(photo.image)} target="_blank" rel="noopener" aria-label={"Открыть изображение: " + material.name}>
                <Image src={sitePath(photo.image)} alt={photo.alt} fill
                  sizes="(max-width: 767px) 80vw, (max-width: 1100px) 42vw, 22vw" />
              </a>
            </div>
          </figure>
          <h3>{material.name}</h3><p>{material.description}</p>
        </article>;
      })}</div>
    </div>
  </section>;
}
