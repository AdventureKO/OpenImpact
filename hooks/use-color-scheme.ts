import { useColorScheme as rnUseColorScheme } from 'react-native';
import { useEffect, useState } from 'react';
import themePref from './theme-pref';

export function useColorScheme() {
	const system = rnUseColorScheme();
	const [pref, setPref] = useState<string | null>(null);

	useEffect(() => {
		let mounted = true;
		themePref.getTheme().then(v => { if (mounted) setPref(v); }).catch(() => {});
		const unsub = themePref.subscribe((v) => { if (mounted) setPref(v); });
		return () => { mounted = false; unsub(); };
	}, []);

	if (pref === 'light' || pref === 'dark') return pref as 'light' | 'dark';
	return system ?? 'light';
}

