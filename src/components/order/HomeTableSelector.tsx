'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Terrace.module.css';

export function HomeTableSelector() {
  const [tableInput, setTableInput] = useState('');
  const router = useRouter();
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const table = Number(tableInput);
    if (Number.isSafeInteger(table) && table > 0) router.push(`/order?table=${table}`);
  }
  return (
    <form onSubmit={handleSubmit} className={styles.tableForm}>
      <label htmlFor="table-number">Let’s start with your table</label>
      <div className={styles.tableFields}>
        <input id="table-number" type="number" inputMode="numeric" min="1" step="1" required value={tableInput} onChange={(event) => setTableInput(event.target.value)} placeholder="Table no." />
        <button type="submit" className={styles.primary}>Explore the menu <span aria-hidden="true">↗</span></button>
      </div>
    </form>
  );
}
