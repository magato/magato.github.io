document.addEventListener('DOMContentLoaded', () => {

            const aperturas = [0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.5, 2.8, 3.2, 3.5, 4.0, 4.5, 5.0, 5.6, 6.3, 7.1, 8, 9, 10, 11, 13, 14, 16, 18, 20, 22, 25, 29, 32];
            const tiemposFraccion = [1/4000, 1/3200, 1/2500, 1/2000, 1/1600, 1/1250, 1/1000, 1/800, 1/640, 1/500, 1/400, 1/320, 1/250, 1/200, 1/160, 1/125, 1/100, 1/80, 1/60, 1/50, 1/40, 1/30, 1/25, 1/20, 1/15, 1/13, 1/10, 1/8, 1/6, 1/5, 1/4, 1/3, 1/2.5, 1/2, 1/1.6, 1/1.3];
            const tiemposSegundos = [1, 1.3, 1.6, 2, 2.5, 3, 4, 5, 6, 8, 10, 13, 15, 20, 25, 30, 40, 50, 60];
            const tiemposLargos = [80, 100, 120, 160, 200, 240, 320, 400, 480, 640, 800, 960, 1280, 1600, 1920, 2560, 3200, 3840, 5120, 6400, 7680];
            const isos = [100, 125, 160, 200, 250, 320, 400, 500, 640, 800, 1000, 1250, 1600, 2000, 2500, 3200, 4000, 5000, 6400, 8000, 10000, 12800];
            
            const aperturaBaseSelect = document.getElementById('apertura-base');
            const tiempoBaseSelect = document.getElementById('tiempo-base');
            const isoBaseSelect = document.getElementById('iso-base');
            const calculateButton = document.getElementById('calculate-button');
            const resetAppButton = document.getElementById('reset-app-button');
            const resultsContent = document.getElementById('results-content');
            const loadingSpinner = document.getElementById('loading');
            
            const aperturaComboSelect = document.getElementById('apertura-combo-select');
            const tiempoComboSelect = document.getElementById('tiempo-combo-select');
            const isoComboSelect = document.getElementById('iso-combo-select');
            const resetResultsButton = document.getElementById('reset-results-button');
            const combinationsList = document.getElementById('combinations-list');
            
            let baseEV = null;

            function formatTiempoLargo(segundos) {
                const minutos = Math.floor(segundos / 60);
                const segundosRestantes = segundos % 60;
                
                if (minutos > 0 && segundosRestantes === 0) {
                    return `${minutos} min`;
                } else if (minutos > 0) {
                    return `${minutos} min ${segundosRestantes} s`;
                }
                return `${segundos} s`;
            }

            const tiempoMap = new Map();
            tiemposFraccion.forEach(t => {
                if (t > 0) {
                    tiempoMap.set(t, `1/${(1/t).toFixed(0)} s`);
                }
            });
            tiemposSegundos.forEach(t => {
                if (t > 0) {
                    tiempoMap.set(t, `${t} s`);
                }
            });
            tiemposLargos.forEach(t => {
                if (t > 0) {
                    tiempoMap.set(t, formatTiempoLargo(t));
                }
            });

            const allTiempos = [...tiemposFraccion, ...tiemposSegundos, ...tiemposLargos].filter(t => t > 0);
        
            function populateSelects() {
                [aperturaBaseSelect, aperturaComboSelect].forEach(select => {
                    aperturas.forEach(f => {
                        const option = document.createElement('option');
                        option.value = f;
                        option.textContent = `f/${f}`;
                        select.appendChild(option);
                    });
                });
        
                [tiempoBaseSelect, tiempoComboSelect].forEach(select => {
                    allTiempos.forEach(t => {
                        const option = document.createElement('option');
                        option.value = t;
                        option.textContent = tiempoMap.get(t);
                        select.appendChild(option);
                    });
                });
        
                [isoBaseSelect, isoComboSelect].forEach(select => {
                    isos.forEach(i => {
                        const option = document.createElement('option');
                        option.value = i;
                        option.textContent = `ISO ${i}`;
                        select.appendChild(option);
                    });
                });
            }
        
            function calculateEV(apertura, tiempo, iso) {
                const ev = Math.log2((apertura * apertura) / tiempo) - Math.log2(iso / 100);
                return ev;
            }
        
            function findReciprocal() {
                if (baseEV === null) return;
        
                const selectedApertura = parseFloat(aperturaComboSelect.value);
                const selectedTiempo = parseFloat(tiempoComboSelect.value);
                const selectedISO = parseInt(isoComboSelect.value);
                const tolerance = 0.05;

                combinationsList.innerHTML = '';
                const foundCombinations = [];

                if (!isNaN(selectedApertura) && !isNaN(selectedTiempo)) {
                    isos.forEach(iso => {
                        if (Math.abs(calculateEV(selectedApertura, selectedTiempo, iso) - baseEV) < tolerance) {
                            foundCombinations.push({
                                apertura: selectedApertura,
                                tiempo: selectedTiempo,
                                iso: iso
                            });
                        }
                    });
                } else if (!isNaN(selectedApertura) && !isNaN(selectedISO)) {
                    allTiempos.forEach(tiempo => {
                        if (Math.abs(calculateEV(selectedApertura, tiempo, selectedISO) - baseEV) < tolerance) {
                            foundCombinations.push({
                                apertura: selectedApertura,
                                tiempo: tiempo,
                                iso: selectedISO
                            });
                        }
                    });
                } else if (!isNaN(selectedTiempo) && !isNaN(selectedISO)) {
                    aperturas.forEach(apertura => {
                        if (Math.abs(calculateEV(apertura, selectedTiempo, selectedISO) - baseEV) < tolerance) {
                            foundCombinations.push({
                                apertura: apertura,
                                tiempo: selectedTiempo,
                                iso: selectedISO
                            });
                        }
                    });
                }
        
                if (foundCombinations.length > 0) {
                    foundCombinations.forEach(combo => {
                        const li = document.createElement('li');
                        li.innerHTML = `<strong>Apertura:</strong> f/${combo.apertura}<br>` +
                                             `<strong>Tiempo:</strong> ${tiempoMap.get(combo.tiempo)}<br>` +
                                             `<strong>ISO:</strong> ${combo.iso}`;
                        combinationsList.appendChild(li);
                    });
                } else {
                    combinationsList.innerHTML = `<li id="no-combinations-message">No se encontraron combinaciones para estos valores.</li>`;
                }
            }
        
            function handleComboChange() {
                const filledCount = [aperturaComboSelect.value, tiempoComboSelect.value, isoComboSelect.value].filter(v => v !== '').length;
                
                if (filledCount >= 2) {
                    [aperturaComboSelect, tiempoComboSelect, isoComboSelect].forEach(select => {
                        if (select.value === '') {
                            select.disabled = true;
                        }
                    });
                    findReciprocal();
                } else {
                    [aperturaComboSelect, tiempoComboSelect, isoComboSelect].forEach(select => select.disabled = false);
                    combinationsList.innerHTML = '';
                }
            }
        
            function resetResults() {
                aperturaComboSelect.value = '';
                tiempoComboSelect.value = '';
                isoComboSelect.value = '';
                [aperturaComboSelect, tiempoComboSelect, isoComboSelect].forEach(select => select.disabled = false);
                combinationsList.innerHTML = '';
            }
        
            function resetApp() {
                aperturaBaseSelect.value = '';
                tiempoBaseSelect.value = '';
                isoBaseSelect.value = '';
                baseEV = null;
                resultsContent.classList.add('hidden');
                resetResults();
            }

            async function calculateBase() {
                const selectedApertura = parseFloat(aperturaBaseSelect.value);
                const selectedTiempo = parseFloat(tiempoBaseSelect.value);
                const selectedISO = parseInt(isoBaseSelect.value);

                if (isNaN(selectedApertura) || isNaN(selectedTiempo) || isNaN(selectedISO)) {
                    alert('Por favor, selecciona valores para Apertura, Tiempo e ISO.');
                    return;
                }

                resultsContent.classList.add('hidden');
                loadingSpinner.classList.remove('hidden');

                await new Promise(resolve => setTimeout(resolve, 500));

                baseEV = calculateEV(selectedApertura, selectedTiempo, selectedISO);
                
                loadingSpinner.classList.add('hidden');
                resultsContent.classList.remove('hidden');
            }
        
            calculateButton.addEventListener('click', calculateBase);
            resetAppButton.addEventListener('click', resetApp);
            resetResultsButton.addEventListener('click', resetResults);
        
            aperturaComboSelect.addEventListener('change', handleComboChange);
            tiempoComboSelect.addEventListener('change', handleComboChange);
            isoComboSelect.addEventListener('change', handleComboChange);
        
            populateSelects();
        });