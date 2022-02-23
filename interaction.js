design = {
    sidebar: {
        toggle: function () {
            return (this._visible() ? this._hide() : this._show());
        },
        _visible: function () {
            return !this._get().classList.contains('inactive');
        },
        _show: function () {
            this._get().querySelector('.wrapper').classList.remove('hidden');
            this._get().classList.toggle('inactive');
            this._get().querySelectorAll('.toggle-icon').forEach(function (e) {
                e.classList.toggle('hidden');
            });
        },
        _hide: function () {
            this._get().querySelector('.wrapper').classList.add('hidden');
            this._get().classList.toggle('inactive');
            this._get().querySelectorAll('.toggle-icon').forEach(function (e) {
                e.classList.toggle('hidden');
            });
        },
        _get: function () {
            return document.getElementById('sidebar');
        }
    },
    passport: {
        show: function (ids) {

            this._get().querySelectorAll('.created').forEach(function (e) {
                e.parentNode.removeChild(e);
            });

            if (ids.length > 0) {
                this.create(ids);
                this._get().classList.remove('hidden');

            } else {
                this._get().classList.add('hidden');
            }
        },
        showNew: function (e) {
            this._get().querySelectorAll('.created').forEach(function (element) {
                element.parentNode.removeChild(element);
            });

            this.createNew(e);
            this._get().classList.remove('hidden');
        },
        create: function(ids) {

            var tabs = this._get().querySelector('.nav-tabs'),
                content = this._get().querySelector('.tab-content');

            this._get().querySelector('.zoom-notice').classList.add('hidden');
            document.getElementById('passport').querySelector('.loader').classList.remove('hidden');

            const element = this;
            let firstTab;

            //ids = [5747575]; // has sensor data
            // ids = [5477]; // has downloads

            ids.forEach(function(id) {
                jQuery.ajax({
                    url: urls.featureDetails,
                    type: "post",
                    data: {
                        id: id
                    }
                }).done(function(r) {
                    if (redirectPage(r) && r.result === 'success') {

                        document.getElementById('passport').querySelector('.loader').classList.add('hidden');

                        var properties = r.message.properties,
                            id = r.message.id;

                        if (properties) {

                            element.drawCarrierTab(element, tabs, content, properties);
                        }
                    }
                })
            });
        },
        createNew(e) {
            var tabs = this._get().querySelector('.nav-tabs'),
                content = this._get().querySelector('.tab-content');

            const transformed = e.feature.getGeometry().clone().transform('EPSG:3857', 'EPSG:28992').getCoordinates();
            const properties = { coordinates: transformed };
            design.passport.drawCarrierTab(design.passport, tabs, content, properties);
        },
        drawCarrierTab(element, tabs, content, properties) {

            if(element._get().querySelector('.tab-content .carrier-tab.template')){
                if (properties.coordinates !== undefined) {
                    properties.rd_x = properties.coordinates[0];
                    properties.rd_y = properties.coordinates[1];
                    properties.rd_z = 0.2;
                }
                let elId = Math.round((new Date()).getTime()); //  / 1000

                let linkTemplate = element._get().querySelector('.nav-tabs .nav-item.template').cloneNode(true);

                linkTemplate.setAttribute('id', 'nav-' + elId + '-tab');
                linkTemplate.setAttribute('href', '#nav-' + elId);
                linkTemplate.setAttribute('aria-controls', 'nav-' + elId);
                linkTemplate.classList.add('created');
                linkTemplate.classList.remove('template', 'hidden');
                linkTemplate.textContent = "Nieuw";
                if (properties.type) {
                    linkTemplate.textContent = properties.type;
                }

                tabs.appendChild(linkTemplate);
                let contentTemplate = element._get().querySelector('.tab-content .carrier-tab.template').cloneNode(true);

                contentTemplate.dataset.id = properties.id || 'new';
                contentTemplate.dataset.article_type_id = 7;
                contentTemplate.setAttribute('id', 'nav-'+elId);
                contentTemplate.setAttribute('aria-labelledby', 'nav-'+elId+'-tab');
                contentTemplate.classList.add('created');
                contentTemplate.classList.remove('template', 'hidden');

                if(contentTemplate.querySelector('.add-btn')){
                    contentTemplate.querySelector('.add-btn')
                               .addEventListener('click', (e) => {
                                   let target = (e.target.tagName === 'I' ? e.target.parentNode : e.target);
                                   if (!target.hasAttribute('disabled')) {
                                       design.passport.drawSignTab(element, tabs, content, {id: 'new', parent_id: properties.id}, true);
                                   }
                               });
                }


                let carrierId = contentTemplate.querySelector('.carrier-id');
                carrierId.querySelector('.value').textContent = contentTemplate.dataset.id;

                if (!properties.id) {
                    contentTemplate.querySelector('.add-btn').setAttribute('disabled', 'disabled');
                }

                if (properties.address) {
                    let address = contentTemplate.querySelector('.carrier-address');
                    if (properties.address) {
                        address.classList.remove('hidden');
                        address.querySelector('.value').textContent = properties.address;
                    }
                }
                if (properties.direction) {
                    let direction = contentTemplate.querySelector('.carrier-direction');
                    if (properties.direction) {
                        direction.classList.remove('hidden');
                        direction.querySelector('.value').textContent = properties.direction;
                        direction.querySelector('input').value = properties.direction;
                    }
                }

                if (properties.type) {
                    let type = contentTemplate.querySelector('.carrier-type');
                    type.querySelector('.value').textContent = properties.type;
                    type.querySelector('select')
                        .querySelectorAll('option').forEach(function(e) {
                        if (e.textContent == properties.type) {
                            e.setAttribute('selected', 'selected');
                        }
                    });
                }

                if (typeof properties.static != 'undefined') {
                    let stat = contentTemplate.querySelector('.carrier-static');
                    stat.querySelector('select')
                        .querySelectorAll('option').forEach(function(e) {
                        if (e.value == properties.static) {
                            e.setAttribute('selected', 'selected');
                            stat.querySelector('.value').textContent = e.textContent;
                        }
                    });
                }

                if (properties.rd_x) {
                    let rdx = contentTemplate.querySelector('.carrier-rd_x');
                    rdx.querySelector('.value').textContent = properties.rd_x;
                    rdx.querySelector('input').value = properties.rd_x;
                }

                if (properties.rd_y) {
                    let rdy = contentTemplate.querySelector('.carrier-rd_y');
                    rdy.querySelector('.value').textContent = properties.rd_y;
                    rdy.querySelector('input').value = properties.rd_y;
                }

                if (properties.rd_z) {
                    let rdz = contentTemplate.querySelector('.carrier-rd_z');
                    rdz.querySelector('.value').textContent = properties.rd_z;
                    rdz.querySelector('input').value = properties.rd_z;
                }

                if (properties.lat) {
                    let lat = contentTemplate.querySelector('.carrier-lat');
                    lat.querySelector('.value').textContent = properties.lat;
                    lat.querySelector('input').value = properties.lat;
                }

                if (properties.lon) {
                    let lon = contentTemplate.querySelector('.carrier-lon');
                    lon.querySelector('.value').textContent = properties.lon;
                    lon.querySelector('input').value = properties.lon;
                }

                if (properties.obj_num_3rd) {
                    let obj_num_3rd = contentTemplate.querySelector('.carrier-obj-num-3rd');
                    obj_num_3rd.querySelector('.value').textContent = properties.obj_num_3rd;
                    obj_num_3rd.querySelector('input').value = properties.obj_num_3rd;
                }

                if (properties.opmerkingen) {
                    let opmerkingen = contentTemplate.querySelector('.carrier-opmerkingen');
                    opmerkingen.querySelector('.value').innerHTML = properties.opmerkingen.replace(/\n/, '<br />');
                    opmerkingen.querySelector('textarea').value = properties.opmerkingen;
                }

                if (properties.lat && properties.lon && properties.rd_x && properties.rd_y) {
                    contentTemplate.querySelectorAll('.map-links a').forEach(function(e) {
                        e.setAttribute(
                            'href',
                            e.getAttribute('href')
                            .replace(/%lat%/g, properties.lat)
                            .replace(/%lon%/g, properties.lon)
                            .replace(/%rd_x%/g, properties.rd_x)
                            .replace(/%rd_y%/g, properties.rd_y)
                        );
                    });
                    contentTemplate.querySelectorAll('.btn_streetsmart').forEach(function(e) {

                        let ghost_x = properties.rd_x;
                        let ghost_y = properties.rd_y;

                        if (properties.direction) {
                            ghost_x = properties.rd_x - 5 * Math.sin( (properties.direction ? properties.direction : 0) * (Math.PI/180));
                            ghost_y = properties.rd_y - 5 * Math.cos( (properties.direction ? properties.direction : 90) * (Math.PI/180));
                        }

                        e.setAttribute('data-rdx', ghost_x);
                        e.setAttribute('data-rdy', ghost_y);
                    });
                } else {
                    contentTemplate.querySelector('.map-links').classList.add('hidden');
                }

            if(properties.details) {
                let actionTable = contentTemplate.querySelector('.action-info .action-table tbody');
                let issueTable  = contentTemplate.querySelector('.action-info .issue-table tbody');

                properties.details.forEach((action) => {

                    let row = document.createElement('tr');
                    row.dataset.id = action.id;

                    let col1 = document.createElement('td');
                    col1.setAttribute('nowrap', 'nowrap');
                    col1.setAttribute('style', 'width:50%;');
                    col1.textContent = action.action;
                    row.appendChild(col1);

                    let col2 = document.createElement('td');
                    col2.setAttribute('nowrap', 'nowrap');
                    col2.setAttribute('style', 'width:30%;');
                    switch(action.priority) {
                        case 0: col2.textContent = 'Laag';
                            break;
                        case 1: col2.textContent = 'Normaal';
                            break;
                        case 2: col2.textContent = 'Hoog';
                            break;
                    }

                    row.appendChild(col2);

                    let col3 = document.createElement('td');
                    col3.setAttribute('nowrap', 'nowrap');
                    col3.setAttribute('style', 'text-align: center; width:20%;');

                    let deletelink = contentTemplate.querySelector('.action-info .delete-link').cloneNode(true);
                    deletelink.removeAttribute("style");
                    deletelink.setAttribute('style', 'margin-left: 10px');
                    deletelink.addEventListener('click', (e) => {

                        let row = jQuery(e.target).closest('tr');
                        let form = new FormData();
                        let xhr = new XMLHttpRequest();

                        form.append('id', action.id);
                        xhr.addEventListener('load', (e) => {
                            if (redirectPage(xhr.responseText)) {
                                let response = JSON.parse(xhr.responseText);
                                if (response.result !== 'failure') {
                                    row.remove();
                                }
                            }
                        }, false);
                        xhr.open('POST', urls.carrierDetailRemove, true);
                        xhr.send(form);
                    });

                    col3.appendChild(deletelink);
                    row.appendChild(col3);

                    if (action.type === 0) {
                        actionTable.appendChild(row);
                    } else {
                        issueTable.appendChild(row);
                    }
                });

                if (actionTable.querySelectorAll('tr').length > 1) {
                    let noActionContentRow = actionTable.querySelector('tr.no-rows');
                    if (noActionContentRow) {
                        actionTable.removeChild(noActionContentRow);
                    }
                }

                if (issueTable.querySelectorAll('tr').length > 1) {
                    let noIssueContentRow = issueTable.querySelector('tr.no-rows');
                    if (noIssueContentRow) {
                        issueTable.removeChild(noIssueContentRow);
                    }
                }
            }

                content.appendChild(contentTemplate);
                linkTemplate.click();
            }
            else{
                let linkTemplate = element._get().querySelector('.nav-tabs .nav-item.template').cloneNode(true);

                linkTemplate.setAttribute('id', 'nav-sales-tab');
                linkTemplate.setAttribute('href', '#nav-sales');
                linkTemplate.setAttribute('aria-controls', 'nav-sales');
                linkTemplate.classList.add('created');
                linkTemplate.classList.remove('template', 'hidden');
                linkTemplate.textContent = "Sales";

                tabs.appendChild(linkTemplate);

                let contentTemplate = element._get().querySelector('.tab-content .sales-tab.template').cloneNode(true);
                contentTemplate.setAttribute('id', 'nav-sales');
                contentTemplate.setAttribute('aria-labelledby', 'nav-sales-tab');
                contentTemplate.classList.add('created');
                contentTemplate.classList.remove('template', 'hidden');
                content.appendChild(contentTemplate);
                linkTemplate.click();
            }

            if (properties.signs) {
                for (let i = 0; i < properties.signs.length; i++) {
                    design.passport.drawSignTab(element, tabs, content, properties.signs[i]);
                }
            }
        },
        drawSignTab(element, tabs, content, properties, newTab) {
            let elId = Math.round((new Date()).getTime()); //  / 1000

            let signLinkTemplate = element._get().querySelector('.nav-tabs .nav-item.template').cloneNode(true);
            signLinkTemplate.setAttribute('id', 'nav-' + elId + '-tab');
            signLinkTemplate.setAttribute('href', '#nav-' + elId);
            signLinkTemplate.setAttribute('aria-controls', 'nav-' + elId);
            signLinkTemplate.classList.add('created');
            signLinkTemplate.classList.remove('template', 'hidden');
            signLinkTemplate.textContent = "Nieuw";
            if (!newTab) {
                signLinkTemplate.textContent
                    = properties.type + ' (' + properties.zone.substr(0, 1).toUpperCase() + ')';
            }

            tabs.appendChild(signLinkTemplate);

            let signTemplate = element._get().querySelector('.tab-content .sign-tab.template').cloneNode(true);

            signTemplate.dataset.id = properties.id || "new";
            signTemplate.dataset.article_type_id = 8;
            signTemplate.dataset.parent_id = properties.parent_id;
            signTemplate.setAttribute('id', 'nav-' + elId);
            signTemplate.setAttribute('aria-labelledby', 'nav-' + elId + '-tab');
            signTemplate.classList.add('created');
            signTemplate.classList.remove('template', 'hidden');

            let img = signTemplate.querySelector('img');
            if (properties.type) {
                img.setAttribute('src', img.getAttribute('data-src') + properties.type.toLowerCase() + '.svg');
            }

            let type = signTemplate.querySelector('.sign-type');
            if (properties.type) {
                type.querySelector('.value').textContent = properties.type.toUpperCase();
                type.querySelector('select')
                    .querySelectorAll('option').forEach(function (e) {
                    if (e.textContent == properties.type.toUpperCase()) {
                        e.setAttribute('selected', 'selected');
                    }
                });
            }

            let status = signTemplate.querySelector('.sign-status');
            if (properties.status) {
                status.querySelector('select')
                    .querySelectorAll('option').forEach(function (e) {
                    if (e.value == properties.status) {
                        status.querySelector('.value').textContent = e.textContent;
                        e.setAttribute('selected', 'selected');
                    }
                });
            }

            let sign_obj_num_3rd = signTemplate.querySelector('.sign-obj-num-3rd');
            sign_obj_num_3rd.classList.remove('hidden');
            if (properties.obj_num_3rd) {
                sign_obj_num_3rd.querySelector('.value').textContent = properties.obj_num_3rd;
                sign_obj_num_3rd.querySelector('input').value = properties.obj_num_3rd;
            }

            let direction = signTemplate.querySelector('.sign-direction');
            direction.classList.remove('hidden');
            if (properties.direction) {
                direction.querySelector('.value').textContent = properties.direction;
                direction.querySelector('input').value = properties.direction;
            }

            let plaatsingsdatum = signTemplate.querySelector('.sign-plaatsingsdatum');
            plaatsingsdatum.classList.remove('hidden');
            if (properties.plaatsingsdatum) {
                plaatsingsdatum.querySelector('.value').textContent = properties.plaatsingsdatum;
                plaatsingsdatum.querySelector('input').value = properties.plaatsingsdatum;
                jQuery(plaatsingsdatum.querySelector('input')).datetimepicker({format:'DD/MM/YYYY', timepicker:false});
            }

            let text = signTemplate.querySelector('.sign-text');
            if (properties.tekst) {
                text.classList.remove('hidden');
                text.querySelector('.value').textContent = properties.tekst;
                text.querySelector('input').value = properties.tekst;
            }

            let produced = signTemplate.querySelector('.sign-produced');
            if (properties.productie_datum) {
                produced.classList.remove('hidden');
                produced.querySelector('.value').textContent = properties.productie_datum;
                produced.querySelector('input').value = properties.productie_datum;
            }

            let eerste_vastlegging = signTemplate.querySelector('.sign-eerste-vastlegging');
            eerste_vastlegging.classList.remove('hidden');
            if (properties.datum_eerste_vastlegging) {
                eerste_vastlegging.querySelector('.value').textContent = properties.datum_eerste_vastlegging;
                eerste_vastlegging.querySelector('input').value = properties.datum_eerste_vastlegging;
                jQuery(eerste_vastlegging.querySelector('input')).datetimepicker({format:'DD/MM/YYYY', timepicker:false});
            }

            let laatste_vastlegging = signTemplate.querySelector('.sign-laatste-vastlegging');
            laatste_vastlegging.classList.remove('hidden');
            if (properties.datum_laatste_vastlegging) {
                laatste_vastlegging.querySelector('.value').textContent = properties.datum_laatste_vastlegging;
                laatste_vastlegging.querySelector('input').value = properties.datum_laatste_vastlegging;
                jQuery(laatste_vastlegging.querySelector('input')).datetimepicker({format:'DD/MM/YYYY', timepicker:false});
            }

            let streetname = signTemplate.querySelector('.sign-streetname');
            streetname.classList.remove('hidden');
            if (properties.streetname) {
                streetname.querySelector('.value').textContent = properties.streetname;
                streetname.querySelector('input').value = properties.streetname;

                if (properties.nwb_data && properties.nwb_data.streetname) {
                    streetname.querySelector('small').classList.remove('hidden');
                    streetname.querySelector('small .default').textContent = properties.nwb_data.streetname;
                }
            }
            else if (properties.nwb_data && properties.nwb_data.streetname) {
                streetname.querySelector('.value').textContent = properties.nwb_data.streetname;
                streetname.querySelector('input').placeholder = properties.nwb_data.streetname;
            }

            let city = signTemplate.querySelector('.sign-city');
            city.classList.remove('hidden');
            if (properties.city) {
                city.querySelector('.value').textContent = properties.city;
                city.querySelector('input').value = properties.city;

                if (properties.nwb_data && properties.nwb_data.city) {
                    city.querySelector('small').classList.remove('hidden');
                    city.querySelector('small .default').textContent = properties.nwb_data.city;
                }
            }
            else if (properties.nwb_data && properties.nwb_data.city) {
                city.querySelector('.value').textContent = properties.nwb_data.city;
                city.querySelector('input').placeholder = properties.nwb_data.city;
            }

            let gemeentenaam = signTemplate.querySelector('.sign-gemeentenaam');
            gemeentenaam.classList.remove('hidden');
            if (properties.gemeentenaam) {
                gemeentenaam.querySelector('.value').textContent = properties.gemeentenaam;
                gemeentenaam.querySelector('input').value = properties.gemeentenaam;

                if (properties.nwb_data && properties.nwb_data.gemeentenaam) {
                    gemeentenaam.querySelector('small').classList.remove('hidden');
                    gemeentenaam.querySelector('small .default').textContent = properties.nwb_data.gemeentenaam;
                }
            }
            else if (properties.nwb_data && properties.nwb_data.gemeentenaam) {
                gemeentenaam.querySelector('.value').textContent = properties.nwb_data.gemeentenaam;
                gemeentenaam.querySelector('input').placeholder = properties.nwb_data.gemeentenaam;
            }

            let county_code = signTemplate.querySelector('.sign-county-code');
            county_code.classList.remove('hidden');
            if (properties.county_code) {
                county_code.querySelector('.value').textContent = properties.county_code;
                county_code.querySelector('input').value = properties.county_code;

                if (properties.nwb_data && properties.nwb_data.county_code) {
                    county_code.querySelector('small').classList.remove('hidden');
                    county_code.querySelector('small .default').textContent = properties.nwb_data.county_code;
                }
            }
            else if (properties.nwb_data && properties.nwb_data.county_code) {
                county_code.querySelector('.value').textContent = properties.nwb_data.county_code;
                county_code.querySelector('input').placeholder = properties.nwb_data.county_code;
            }

            let wegbeheerder = signTemplate.querySelector('.sign-road-manager');
            wegbeheerder.classList.remove('hidden');
            if (properties.wegbeheerder) {
                wegbeheerder.querySelector('.value').textContent = properties.wegbeheerder;
                wegbeheerder.querySelector('select').value = properties.wegbeheerder;

                if (properties.nwb_data && properties.nwb_data.wegbeheerder) {
                    wegbeheerder.querySelector('small').classList.remove('hidden');
                    wegbeheerder.querySelector('small .default').textContent = properties.nwb_data.wegbeheerder;
                }
            }
            else if (properties.nwb_data && properties.nwb_data.wegbeheerder) {
                wegbeheerder.querySelector('.value').textContent = properties.nwb_data.wegbeheerder;
                wegbeheerder.querySelector('select').value = properties.nwb_data.wegbeheerder;
            }

            let wegnummer = signTemplate.querySelector('.sign-wegnummer');
            wegnummer.classList.remove('hidden');
            if (properties.wegnummer) {
                wegnummer.querySelector('.value').textContent = properties.wegnummer;
                wegnummer.querySelector('input').value = properties.wegnummer;

                if (properties.nwb_data && properties.nwb_data.wegnummer) {
                    wegnummer.querySelector('small').classList.remove('hidden');
                    wegnummer.querySelector('small .default').textContent = properties.nwb_data.wegnummer;
                }
            }
            else if (properties.nwb_data && properties.nwb_data.wegnummer) {
                wegnummer.querySelector('.value').textContent = properties.nwb_data.wegnummer;
                wegnummer.querySelector('input').placeholder = properties.nwb_data.wegnummer;
            }

            let wegvak_id = signTemplate.querySelector('.sign-wegvak-id');
            wegvak_id.classList.remove('hidden');
            if (properties.wegvak_id) {
                wegvak_id.querySelector('.value').textContent = properties.wegvak_id;
                wegvak_id.querySelector('input').value = properties.wegvak_id;

                if (properties.nwb_data && properties.nwb_data.wegvak_id) {
                    wegvak_id.querySelector('small').classList.remove('hidden');
                    wegvak_id.querySelector('small .default').textContent = properties.nwb_data.wegvak_id;
                }
            }
            else if (properties.nwb_data && properties.nwb_data.wegvak_id) {
                wegvak_id.querySelector('.value').textContent = properties.nwb_data.wegvak_id;
                wegvak_id.querySelector('input').placeholder = properties.nwb_data.wegvak_id;
            }

            let zijde = signTemplate.querySelector('.sign-zijde');
            zijde.classList.remove('hidden');
            if (properties.zijde) {
                zijde.querySelector('.value').textContent = properties.zijde;
                zijde.querySelector('input').value = properties.zijde;

                if (properties.nwb_data && properties.nwb_data.zijde) {
                    zijde.querySelector('small').classList.remove('hidden');
                    zijde.querySelector('small .default').textContent = properties.nwb_data.zijde;
                }
            }
            else if (properties.nwb_data && properties.nwb_data.zijde) {
                zijde.querySelector('.value').textContent = properties.nwb_data.zijde;
                zijde.querySelector('input').placeholder = properties.nwb_data.zijde;
            }

            let boven_langs = signTemplate.querySelector('.sign-boven-langs');
            boven_langs.classList.remove('hidden');
            if (properties.boven_langs) {
                boven_langs.querySelector('.value').textContent = properties.boven_langs;
                boven_langs.querySelector('select').value = properties.boven_langs == 'Boven' ? 1 : 0;
            }

            let sensor = signTemplate.querySelector('.sign-sensor');
            sensor.classList.remove('hidden');
            if (properties.sensor_id) {
                sensor.querySelector('select')
                      .querySelectorAll('option').forEach(function (e) {
                    if (e.value == properties.sensor_id) {
                        e.setAttribute('selected', 'selected');
                        sensor.querySelector('.value').textContent = e.textContent;
                    }
                });
            }

            let height = signTemplate.querySelector('.sign-height');
            height.classList.remove('hidden');
            if (properties.hoogte_onderkant_bord) {
                height.querySelector('.value').textContent = properties.hoogte_onderkant_bord;
                height.querySelector('input').value = properties.hoogte_onderkant_bord;
            }

            let shape = signTemplate.querySelector('.sign-shape');
            shape.classList.remove('hidden');
            if (properties.afmeting) {
                shape.querySelector('.value').textContent = properties.afmeting;
                shape.querySelector('select')
                     .querySelectorAll('option').forEach(function (e) {
                    if (e.textContent == properties.afmeting) {
                        e.setAttribute('selected', 'selected');
                    }
                });
            }

            let hold = signTemplate.querySelector('.sign-hold');
            hold.classList.remove('hidden');
            if (properties.bevestiging) {
                hold.querySelector('.value').textContent = properties.bevestiging;
                hold.querySelector('select')
                    .querySelectorAll('option').forEach(function (e) {
                    if (e.textContent == properties.bevestiging) {
                        e.setAttribute('selected', 'selected');
                    }
                });
            }

            let profile = signTemplate.querySelector('.sign-profile');
            profile.classList.remove('hidden');
            if (properties.profiel) {
                profile.querySelector('.value').textContent = properties.profiel;
                profile.querySelector('select')
                       .querySelectorAll('option').forEach(function (e) {
                    if (e.textContent == properties.profiel) {
                        e.setAttribute('selected', 'selected');
                    }
                });
            }

            let supplier = signTemplate.querySelector('.sign-supplier');
            supplier.classList.remove('hidden');
            if (properties.leverancier) {
                supplier.querySelector('.value').textContent = properties.leverancier;
                supplier.querySelector('select')
                        .querySelectorAll('option').forEach(function (e) {
                    if (e.textContent == properties.leverancier) {
                        e.setAttribute('selected', 'selected');
                    }
                });
            }

            let sign_opmerkingen = signTemplate.querySelector('.sign-opmerkingen');
            sign_opmerkingen.classList.remove('hidden');
            if (properties.opmerkingen) {
                sign_opmerkingen.classList.remove('hidden');
                sign_opmerkingen.querySelector('.value').innerHTML = properties.opmerkingen.replace(/\n/, '<br />');
                sign_opmerkingen.querySelector('textarea').value = properties.opmerkingen;
            }


            if (properties.rd_x && properties.rd_y) {
                signTemplate.querySelectorAll('.btn_streetsmart').forEach(function(e) {
                    e.setAttribute('data-rdx',  properties.rd_x);
                    e.setAttribute('data-rdy',  properties.rd_y);
                });
            } else {
                signTemplate.querySelector('.map-links').classList.add('hidden');
            }

            if(properties.details) {
                let actionTable = signTemplate.querySelector('.action-info .action-table tbody');
                let issueTable  = signTemplate.querySelector('.action-info .issue-table tbody');

                properties.details.forEach((action) => {

                    let row = document.createElement('tr');
                    row.dataset.id = action.id;

                    let col1 = document.createElement('td');
                    col1.setAttribute('nowrap', 'nowrap');
                    col1.setAttribute('style', 'width:50%;');
                    col1.textContent = action.action;
                    row.appendChild(col1);

                    let col2 = document.createElement('td');
                    col2.setAttribute('nowrap', 'nowrap');
                    col2.setAttribute('style', 'width:30%;');
                    switch(action.priority) {
                        case 0: col2.textContent = 'Laag';
                            break;
                        case 1: col2.textContent = 'Normaal';
                            break;
                        case 2: col2.textContent = 'Hoog';
                            break;
                    }

                    row.appendChild(col2);

                    let col3 = document.createElement('td');
                    col3.setAttribute('nowrap', 'nowrap');
                    col3.setAttribute('style', 'text-align: center; width:20%;');

                    let deletelink = signTemplate.querySelector('.action-info .delete-link').cloneNode(true);
                    deletelink.removeAttribute("style");
                    deletelink.setAttribute('style', 'margin-left: 10px');
                    deletelink.addEventListener('click', (e) => {

                        let row = jQuery(e.target).closest('tr');
                        let form = new FormData();
                        let xhr = new XMLHttpRequest();

                        form.append('id', action.id);
                        xhr.addEventListener('load', (e) => {
                            if (redirectPage(xhr.responseText)) {
                                let response = JSON.parse(xhr.responseText);
                                if (response.result !== 'failure') {
                                    row.remove();
                                }
                            }
                        }, false);
                        xhr.open('POST', urls.signDetailRemove, true);
                        xhr.send(form);
                    });

                    col3.appendChild(deletelink);
                    row.appendChild(col3);

                    if (action.type === 0) {
                        actionTable.appendChild(row);
                    } else {
                        issueTable.appendChild(row);
                    }
                });

                if (actionTable.querySelectorAll('tr').length > 1) {
                    let noActionContentRow = actionTable.querySelector('tr.no-rows');
                    if (noActionContentRow) {
                        actionTable.removeChild(noActionContentRow);
                    }
                }

                if (issueTable.querySelectorAll('tr').length > 1) {
                    let noIssueContentRow = issueTable.querySelector('tr.no-rows');
                    if (noIssueContentRow) {
                        issueTable.removeChild(noIssueContentRow);
                    }
                }
            }

            if (properties.history && properties.history.length > 0) {

                let historyTable = signTemplate.querySelector('.history-info tbody');

                let noContentRow = historyTable.querySelector('tr');

                historyTable.removeChild(noContentRow);

                properties.history.forEach((h) => {
                    let row = document.createElement('tr');

                    let col1 = document.createElement('td');
                    col1.setAttribute('nowrap', 'nowrap');
                    col1.textContent = h.data_type.name;
                    row.appendChild(col1);

                    let col2 = document.createElement('td');
                    col2.textContent = (h.user && h.user.id ? h.user.username : 'sensor');
                    row.appendChild(col2);

                    let col3 = document.createElement('td');
                    col3.classList.add('history-value');
                    col3.classList.add('clipped');
                    col3.textContent = h.value;
                    col3.addEventListener('click', (e) => {
                        e.target.classList.toggle('clipped');
                    });
                    row.appendChild(col3);

                    let col4 = document.createElement('td');
                    col4.setAttribute('nowrap', 'nowrap');

                    let d = new Date(h.datetime);

                    col4.textContent = ("0" + d.getDate()).slice(-2) + "-" + ("0"+(d.getMonth()+1)).slice(-2) + "-" +
                        d.getFullYear() + " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);

                    col4.setAttribute('title', col4.textContent + ":" + ("0" + d.getSeconds()).slice(-2));

                    row.appendChild(col4);

                    historyTable.appendChild(row);
                });
            }

            signTemplate.querySelector('form.document-upload')
                        .addEventListener('submit', (e) => {

                            e.preventDefault();

                            // let form = new FormData(e.target);
                            let form = new FormData();
                            var xhr = new XMLHttpRequest();

                            form.append('article_id', e.target.querySelector('input.article_id').value);
                            form.append('description', e.target.querySelector('input.description').value);
                            form.append('file', e.target.querySelector('input[type="file"]').files[0]);

                            xhr.addEventListener("load", (e) => {
                                if(redirectPage(xhr.responseText)){
                                    let response = JSON.parse(xhr.responseText);
                                    if(response.result === 'failure'){
                                        alert(response.message);
                                    }
                                    else{
                                        let documentsTable = signTemplate.querySelector('.document-info tbody');

                                        let row = document.createElement('tr');

                                        let col1 = document.createElement('td');
                                        col1.setAttribute('nowrap', 'nowrap');
                                        col1.textContent = response.message.name;
                                        row.appendChild(col1);

                                        let col2 = document.createElement('td');
                                        col2.textContent = response.message.description;
                                        row.appendChild(col2);

                                        let col3 = document.createElement('td');
                                        row.appendChild(col3);

                                        let link = document.createElement('a');
                                        link.href = '/viewer/documents/download/'+response.message.id
                                        link.target = '_blank';

                                        let icon = document.createElement('i');
                                        icon.classList.add('fa');
                                        icon.classList.add('fa-download');

                                        link.appendChild(icon);

                                        col3.appendChild(link);

                                        documentsTable.appendChild(row);
                                    }
                                }
                            }, false);

                            xhr.open('POST', e.target.action, true);
                            xhr.send(form);
                        });

            signTemplate.querySelector('form.document-upload input.article_id').value = properties.id;

            if (properties.documents && properties.documents.length > 0) {

                let documentsTable = signTemplate.querySelector('.document-info tbody');

                let noContentRow = documentsTable.querySelector('tr');

                documentsTable.removeChild(noContentRow);

                properties.documents.forEach((d) => {
                    let row = document.createElement('tr');

                    let col1 = document.createElement('td');
                    col1.setAttribute('nowrap', 'nowrap');
                    col1.textContent = d.name;
                    row.appendChild(col1);

                    let col2 = document.createElement('td');
                    col2.textContent = d.description;
                    row.appendChild(col2);

                    let col3 = document.createElement('td');
                    row.appendChild(col3);

                    let link = document.createElement('a');
                    link.href = '/viewer/documents/download/'+d.id
                    link.target = '_blank';

                    let icon = document.createElement('i');
                    icon.classList.add('fa');
                    icon.classList.add('fa-download');

                    link.appendChild(icon);

                    col3.appendChild(link);

                    documentsTable.appendChild(row);
                });
            }

            content.appendChild(signTemplate);
        },
        hide: function () {
            this._get().querySelector('.loader').classList.add('hidden');
            this._get().classList.add('hidden');
        },
        _get: function () {
            return document.getElementById('passport');
        }
    },
    totals: {
        update: function(total) {
            document
                .getElementById('totals')
                .querySelector('.carriers')
                .textContent = total;
        },
        updateByCollection: function(features) {

            if ( ! features) { features = carriers.features; }

            this.update(features.length);
        }
    }
};

var CryptoJSAesJson = {
    stringify: function (cipherParams) {
        var j = {ct: cipherParams.ciphertext.toString(CryptoJS.enc.Base64)};
        if (cipherParams.iv) j.iv = cipherParams.iv.toString();
        if (cipherParams.salt) j.s = cipherParams.salt.toString();
        return JSON.stringify(j);
    },
    parse: function (jsonStr) {
        var j = JSON.parse(jsonStr);
        var cipherParams = CryptoJS.lib.CipherParams.create({ciphertext: CryptoJS.enc.Base64.parse(j.ct)});
        if (j.iv) cipherParams.iv = CryptoJS.enc.Hex.parse(j.iv)
        if (j.s) cipherParams.salt = CryptoJS.enc.Hex.parse(j.s)
        return cipherParams;
    }
}

jQuery(document).ready(function () {
    var streetsmartModal = document.getElementById('streetsmartModal');
    streetsmartModal.querySelector('#username').value = JSON.parse(CryptoJS.AES.decrypt(ssApiInfo.user, 'encryption phrase1', {format: CryptoJSAesJson}).toString(CryptoJS.enc.Utf8));
    streetsmartModal.querySelector('#password').value = JSON.parse(CryptoJS.AES.decrypt(ssApiInfo.pass, 'encryption phrase2', {format: CryptoJSAesJson}).toString(CryptoJS.enc.Utf8));
    function initApi(srs, rd_x, rd_y, username = '', password = '') {
        jQuery('#streetsmartModal .lds-dual-ring').show();
        if((ssApiInfo && ssApiInfo.user && ssApiInfo.pass) || (username && password)){
            StreetSmartApi.init({
               targetElement: streetsmartModal.querySelector('#streetsmartApi'),
               username: username ? username : JSON.parse(CryptoJS.AES.decrypt(ssApiInfo.user, 'encryption phrase1', {format: CryptoJSAesJson}).toString(CryptoJS.enc.Utf8)),
               password: password ? password : JSON.parse(CryptoJS.AES.decrypt(ssApiInfo.pass, 'encryption phrase2', {format: CryptoJSAesJson}).toString(CryptoJS.enc.Utf8)),
               apiKey: ssApiInfo.key ? JSON.parse(CryptoJS.AES.decrypt(ssApiInfo.key, 'encryption phrase3', {format: CryptoJSAesJson}).toString(CryptoJS.enc.Utf8)) : 'apiKey',
               locale: 'en-us',
               srs: srs,
               configurationUrl: 'https://atlas.cyclomedia.com/configuration',
               addressSettings:
                  {
                    locale: "en",
                    database: "CMDatabase"
                  }
            }).then(
                function() {
                    streetsmartModal.querySelector('#streetsmartApi').style.display = 'inline-block';
                    streetsmartModal.querySelector('#streetsmartApi').style.height = '465px';
                    streetsmartModal.style.height = '525px';
                    streetsmartModal.style.minHeight = '525px';
                    streetsmartModal.querySelector('.lds-dual-ring').style.display = 'none';
                    streetsmartModal.querySelector('.user-form').style.display = 'none';
                    streetsmartModal.querySelector('.buttonpane').style.display = 'none';
                    var viewerType = StreetSmartApi.ViewerType.PANORAMA
                    StreetSmartApi.open(rd_x+','+rd_y,
                    {
                        viewerType: viewerType,
                        srs: srs,
                    }).then(
                    function(result) {
                        if (result)
                        {
                            for (let i =0; i < result.length; i++)
                            {
                                if(result[i].getType() === StreetSmartApi.ViewerType.PANORAMA ) window.panoramaViewer = result[i];
                            }
                        }
                    }.bind(this)
                ).catch(
                    function(reason) {
                        streetsmartModal.querySelector('.lds-dual-ring').style.display = 'none';
                        alert('Failed to create component(s) through API: ' + reason);
                    }
                );},
                function(err) {
                    streetsmartModal.querySelector('.lds-dual-ring').style.display = 'none';
                    streetsmartModal.querySelector('.user-form').style.display = 'block';
                    streetsmartModal.querySelector('.error').innerHTML = 'Api Init Failed!';
                    streetsmartModal.querySelector('.error').style.display = 'block';
                    streetsmartModal.querySelector('.buttonpane').style.display = 'block';
                    streetsmartModal.querySelector('#streetsmartSRS').value = srs;
                    streetsmartModal.querySelector('#streetsmartRDX').value = rd_x;
                    streetsmartModal.querySelector('#streetsmartRDY').value = rd_y;
                    streetsmartModal.style.height = '260px';
                    streetsmartModal.style.minHeight = '260px';
                }
            );
        }
        else {
            streetsmartModal.querySelector('#streetsmartApi').style.display = 'none';
            streetsmartModal.querySelector('.lds-dual-ring').style.display = 'none';
            streetsmartModal.querySelector('#streetsmartSRS').value = srs;
            streetsmartModal.querySelector('#streetsmartRDX').value = rd_x;
            streetsmartModal.querySelector('#streetsmartRDY').value = rd_y;
            streetsmartModal.querySelector('.user-form').style.display = 'block';
            streetsmartModal.querySelector('.buttonpane').style.display = 'block';
            streetsmartModal.style.height = '260px';
            streetsmartModal.style.minHeight = '260px';
        }
    }

    function destroyApi(){
        StreetSmartApi.destroy({targetElement : streetsmartModal.querySelector('#streetsmartApi')});
        streetsmartModal.querySelector('#streetsmartApi').style.display = 'none';
        streetsmartModal.querySelector('.lds-dual-ring').style.display = 'none';
        streetsmartModal.querySelector('#streetsmartSRS').value = '';
        streetsmartModal.querySelector('#streetsmartRDX').value = '';
        streetsmartModal.querySelector('#streetsmartRDY').value = '';
        streetsmartModal.querySelector('.user-form').style.display = 'none';
        streetsmartModal.querySelector('.buttonpane').style.display = 'none';
    }

    function callbackDialog(btnName) {
    }

    jQuery('.sidebar-toggle').click(design.sidebar.toggle.bind(design.sidebar));
    jQuery('#loader-overlay').fadeOut('fast');

    jQuery('#passport')
        .on('click', '.edit-btn', function() {
            let container = jQuery(this).closest('.container');

            container.find('.sign-info').addClass('hidden');
            container.find('.main-info').removeClass('hidden');

            container.find('.value, .map-links').addClass('hidden');
            container.find('.edit').removeClass('hidden');
        })
        .on('click', '.cancel-btn, .main-btn', function() {
            let container = jQuery(this).closest('.container');
            container.find('.value, .map-links').removeClass('hidden');
            container.find('.edit').addClass('hidden');

            container.find('.row.control .button').removeClass('active');
            container.find('.row.control .main-btn').addClass('active');
            container.find('.row.control .info-btn').addClass('active');
        })
        .on('click', '.row.control a', function() {
            let jthis = jQuery(this);
            if (!jthis.attr('disabled')) {
                jQuery('.button', jthis.parent()).removeClass('active');
                jthis.addClass('active');
            }
        })
        .on('click', '.documents-btn', function() {
            jQuery('.sign-info', jQuery(this).closest('.container')).addClass('hidden');
            jQuery('.document-info', jQuery(this).closest('.container')).removeClass('hidden');
        })
        .on('click', '.info-btn', function() {
            let container = jQuery(this).closest('.container');

            container.find('.sign-info').addClass('hidden');
            container.find('.main-info').removeClass('hidden');

            container.find('.value').removeClass('hidden');
            container.find('.edit').addClass('hidden');

            container.find('.row.control .button').removeClass('active');
            container.find('.row.control .main-btn').addClass('active');
            container.find('.row.control .info-btn').addClass('active');
        })
        .on('click', '.history-btn', function() {
            jQuery('.sign-info', jQuery(this).closest('.container')).addClass('hidden');
            jQuery('.history-info', jQuery(this).closest('.container')).removeClass('hidden');
        })
        .on('click', '.btn_streetsmart', function() {
            if (window.getComputedStyle(streetsmartModal).display === "none") {
                dialog = new DialogBox('streetsmartModal', callbackDialog);
                dialog.showDialog();
                streetsmartModal.style.minWidth = '512px';
                streetsmartModal.style.width = '512px';
                initApi('EPSG:28992', this.dataset.rdx, this.dataset.rdy);
            }
        })
        .on('click', '.action-btn', function() {
            jQuery('.sign-info', jQuery(this).closest('.container')).addClass('hidden');
            jQuery('.action-info', jQuery(this).closest('.container')).removeClass('hidden');
        });

    streetsmartModal.querySelector('.close').addEventListener("click", function(){
        destroyApi();
        streetsmartModal.querySelector('#username').value = '';
        streetsmartModal.querySelector('#password').value = '';
        streetsmartModal.querySelector('.error').style.display = 'none';
    });

    streetsmartModal.querySelector('.btn-ok').addEventListener("click", function(){
        streetsmartModal.querySelector('.error').style.display = 'none';
        let username = streetsmartModal.querySelector('#username').value;
        let password = streetsmartModal.querySelector('#password').value;
        let srs = streetsmartModal.querySelector('#streetsmartSRS').value;
        let rd_x = streetsmartModal.querySelector('#streetsmartRDX').value;
        let rd_y = streetsmartModal.querySelector('#streetsmartRDY').value;
        if(username && password){
            streetsmartModal.querySelector('.user-form').style.display = 'none';
            initApi(srs, rd_x, rd_y, username, password);
        }
        else{
            streetsmartModal.querySelector('.error').innerHTML = 'Please input username and password.';
            streetsmartModal.querySelector('.error').style.display = 'block';
        }
    });

    setInterval(function(){
        let url = '/request/ajax_check_session';
        jQuery.ajax({
            type: "GET",
            url: url,
        }).done(function(result) {
            redirectPage(result);
        });
    }, sessionTime * 60 * 1000 + 5000);
});

jQuery(function () {
    jQuery.datetimepicker.setDateFormatter('moment');
    jQuery.datetimepicker.setLocale('en');
});
