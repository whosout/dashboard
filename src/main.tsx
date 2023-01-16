import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './styles.css'

import styles from './main.module.css'

createRoot(document.querySelector('#root')!).render(
	<StrictMode>
		<div className={styles.example}>whosout dashboard</div>
	</StrictMode>,
)
