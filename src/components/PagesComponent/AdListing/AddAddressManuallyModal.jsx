
"use client"
import { Modal, Select } from "antd"
import { MdClose } from 'react-icons/md'
import { t } from '@/utils'
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { CurrentLanguageData } from '@/redux/reuducer/languageSlice';


const AddAddressManuallyModal = ({ isOpen, OnHide, CountryStore, setCountryStore, handleCountryScroll, StateStore, setStateStore, handleStateScroll, setCityStore, CityStore, handleCityScroll, AreaStore, setAreaStore, handleAreaScroll, Address, setAddress, setLocation }) => {

    const CloseIcon = <div className="close_icon_cont"><MdClose size={24} color="black" /></div>
    const [fieldErrors, setFieldErrors] = useState({});
    const CurrentLanguage = useSelector(CurrentLanguageData);
    const isArabic = CurrentLanguage?.code === "ar";

    // Helper function to get display name (Arabic if available, otherwise English)
    const getDisplayName = (item) => {
        if (isArabic && item?.name_ar && item.name_ar.trim() !== '') {
            return item.name_ar;
        }
        return item?.name || '';
    };

    const validateFields = () => {
        const errors = {};
        if (!CountryStore?.SelectedCountry?.name) errors.country = true;
        if (!StateStore?.SelectedState?.name) errors.state = true;
        if (!CityStore?.SelectedCity?.name) errors.city = true;
        if (!AreaStore?.SelectedArea?.name && !Address.trim()) errors.address = true;
        return errors;
    };

    const handleCountryChange = (value) => {
        const Country = CountryStore?.Countries.find(country => country.name === value?.value);
        setCountryStore(prev => ({
            ...prev,
            SelectedCountry: Country
        }));
        setStateStore({
            States: [],
            SelectedState: {},
            StateSearch: '',
            currentPage: 1,
            hasMore: false,
        });
        setCityStore({
            Cities: [],
            SelectedCity: {},
            CitySearch: '',
            currentPage: 1,
            hasMore: false,
        });
        setAreaStore({
            Areas: [],
            SelectedArea: {},
            AreaSearch: '',
            currentPage: 1,
            hasMore: false,
        });
        setAddress('')
    }

    const handleStateChange = (value) => {
        const State = StateStore?.States.find(state => state.name === value?.value);
        setStateStore(prev => ({
            ...prev,
            SelectedState: State
        }));
        setCityStore({
            Cities: [],
            SelectedCity: {},
            CitySearch: '',
            currentPage: 1,
            hasMore: false,
        });
        setAreaStore({
            Areas: [],
            SelectedArea: {},
            AreaSearch: '',
            currentPage: 1,
            hasMore: false,
        });
        setAddress('')
    }
    const handleCityChange = (value) => {
        const City = CityStore?.Cities.find(city => city.name === value?.value);
        setCityStore(prev => ({
            ...prev,
            SelectedCity: City
        }));
        setAreaStore({
            Areas: [],
            SelectedArea: {},
            AreaSearch: '',
            currentPage: 1,
            hasMore: false,
        });
        setAddress('')
    }
    const handleAreaChange = (value) => {
        const chosenArea = AreaStore?.Areas.find(item => item.name === value?.value);
        setAreaStore(prev => ({
            ...prev,
            SelectedArea: chosenArea
        }));

    }

    const handleCountrySearch = (value) => {
        setCountryStore(prev => ({
            ...prev,
            CountrySearch: value
        }))
    };
    const handleStateSearch = (value) => {
        setStateStore(prev => ({
            ...prev,
            StateSearch: value
        }))
    };
    const handleCitySearch = (value) => {
        setCityStore(prev => ({
            ...prev,
            CitySearch: value
        }))
    };
    const handleAreaSearch = (value) => {
        setAreaStore(prev => ({
            ...prev,
            AreaSearch: value
        }))
    };


    const handleAddressChange = (e) => {
        setAddress(e.target.value)
    }



    const handleSave = () => {

        const errors = validateFields();
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) return;
        const formattedAddress = `${AreaStore?.Areas.length !== 0 ? getDisplayName(AreaStore?.SelectedArea) : Address || ""}, ${getDisplayName(CityStore?.SelectedCity) || ""}, ${getDisplayName(StateStore?.SelectedState) || ""}, ${getDisplayName(CountryStore?.SelectedCountry) || ""}`.replace(/, ,|, $/g, "").trim();
        const locationData = {
            country: getDisplayName(CountryStore?.SelectedCountry) || "",
            state: getDisplayName(StateStore?.SelectedState) || "",
            city: getDisplayName(CityStore?.SelectedCity) || "",
            address: formattedAddress,
            lat: CityStore?.SelectedCity?.latitude || null,
            long: CityStore?.SelectedCity?.longitude || null,
        };
        setLocation(locationData);
        OnHide()
    }

    return (
        <Modal
            centered
            open={isOpen}
            closeIcon={CloseIcon}
            colorIconHover='transparent'
            className="ant_register_modal"
            onCancel={OnHide}
            footer={null}
            maskClosable={false}
        >
            <div className='manuallyAddAddressCont'>

                <h5 className='whoMadePurchase'>{t('manuAddAddress')}</h5>
                <div className='extradet_select_wrap'>
                    <div>
                        <label className='auth_label'>{t('country')}</label>
                        <Select
                            showSearch
                            style={{ width: "100%" }}
                            placeholder={t('countrySelect')}
                            onChange={handleCountryChange}
                            onSearch={handleCountrySearch}
                            labelInValue
                            filterOption={false}
                            className={`location_select ${fieldErrors.country ? "error-field" : ""}`}
                            defaultValue='All Categories'
                            value={Object.keys(CountryStore?.SelectedCountry).length !== 0 ? { value: CountryStore?.SelectedCountry?.name, label: getDisplayName(CountryStore?.SelectedCountry) } : null}
                            onPopupScroll={handleCountryScroll}
                        >
                            {CountryStore?.Countries && CountryStore?.Countries.map((country, index) => (
                                <Select.Option key={index} value={country.name}>
                                    {getDisplayName(country)}
                                </Select.Option>
                            ))}
                        </Select>
                    </div>

                    <div>
                        <label className='auth_label' >{t('state')}</label>
                        <Select
                            showSearch
                            style={{ width: "100%" }}
                            placeholder={t('stateSelect')}
                            onChange={handleStateChange}
                            onSearch={handleStateSearch}
                            labelInValue
                            filterOption={false}
                            className={`location_select ${fieldErrors.state ? "error-field" : ""}`}
                            value={Object.keys(StateStore?.SelectedState).length !== 0 ? { value: StateStore?.SelectedState?.name, label: getDisplayName(StateStore?.SelectedState) } : null}
                            disabled={Object.keys(CountryStore?.SelectedCountry).length === 0}
                            onPopupScroll={handleStateScroll}
                        >
                            {StateStore?.States && StateStore?.States.map((state, index) => (
                                <Select.Option key={index} value={state.name}>
                                    {getDisplayName(state)}
                                </Select.Option>
                            ))}
                        </Select>
                    </div>

                    <div>
                        <label className='auth_label' >{t('city')}</label>
                        <Select
                            showSearch
                            style={{ width: "100%" }}
                            placeholder={t('citySelect')}
                            onChange={handleCityChange}
                            onSearch={handleCitySearch}
                            labelInValue
                            value={Object.keys(CityStore?.SelectedCity).length !== 0 ? { value: CityStore?.SelectedCity?.name, label: getDisplayName(CityStore?.SelectedCity) } : null}
                            filterOption={false}
                            className={`location_select ${fieldErrors.city ? "error-field" : ""}`}
                            disabled={Object.keys(StateStore?.SelectedState).length === 0}
                            onPopupScroll={handleCityScroll}
                        >
                            {CityStore?.Cities.map((city, index) => (
                                <Select.Option key={index} value={city.name}>
                                    {getDisplayName(city)}
                                </Select.Option>
                            ))}
                        </Select>
                    </div>

                    {AreaStore?.Areas.length !== 0 || AreaStore?.AreaSearch ? (

                        <div>
                            <label className='auth_label' >{t('area')}</label>
                            <Select
                                showSearch
                                style={{ width: "100%" }}
                                placeholder={t('areaSelect')}
                                onChange={handleAreaChange}
                                onSearch={handleAreaSearch}
                                labelInValue
                                filterOption={false}
                                className={`location_select ${fieldErrors.address ? "error-field" : ""}`}
                                onPopupScroll={handleAreaScroll}
                                disabled={Object.keys(CityStore?.SelectedCity).length === 0}
                                value={Object.keys(AreaStore?.SelectedArea).length !== 0 ? { value: AreaStore?.SelectedArea?.name, label: getDisplayName(AreaStore?.SelectedArea) } : null}
                            >
                                {AreaStore?.Areas.map((item, index) => (
                                    <Select.Option key={index} value={item.name}>
                                        {getDisplayName(item)}
                                    </Select.Option>
                                ))}
                            </Select>
                        </div>

                    ) : (
                        Object.keys(CityStore?.SelectedCity).length !== 0 && (
                            <div className='auth_in_cont'>
                                <label htmlFor="address" className='auth_label'>{t('addressDetails')}</label>
                                <textarea name="address" id="address" rows="3" className={`auth_input ${fieldErrors.address ? "error-field" : ""}`} value={Address} onChange={handleAddressChange} placeholder={t('enterAddre')}></textarea>
                            </div>
                        )
                    )}
                </div>
                <div className='locManuallyCont'>
                    <span onClick={OnHide}>{t('cancel')}</span>
                    <button className='saveBtn' onClick={handleSave}>{t('save')}</button>
                </div>
            </div>
        </Modal>
    )
}

export default AddAddressManuallyModal
