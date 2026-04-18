import { fetchDepartureData } from "../../_utils/api";
import styles from "../../styles/Departures.module.scss";
import Loader from "../../_components/_partials/Loader";
import { Suspense } from "react";
import { IDeparture } from "../../interfaces/interfaces";

function formatTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

async function DeparturesTable({ stationCode }: { stationCode: string }) {
  const data = await fetchDepartureData(stationCode);

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Time</th>
          <th>Direction</th>
          <th>Track</th>
          <th>Type</th>
        </tr>
      </thead>
      <tbody>
        {data.departures.map((dep: IDeparture, i: number) => (
          <tr key={i} className={dep.cancelled ? styles.cancelled : ""}>
            <td>{formatTime(dep.actualDateTime ?? dep.plannedDateTime)}</td>
            <td>{dep.direction}</td>
            <td>{dep.actualTrack ?? dep.plannedTrack ?? "—"}</td>
            <td>{dep.trainCategory}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default async function DeparturesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>Departures — {id.toUpperCase()}</h1>
      <Suspense fallback={<Loader />}>
        <DeparturesTable stationCode={id} />
      </Suspense>
    </main>
  );
}
