import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCardByQuery } from '../services/cardService';
import { setCard, setLoading, setError } from '../store/cardSlice';
import { RootState } from '../store/store';

const Card: React.FC = () => {
    const dispatch = useDispatch();
    const { card, loading, error } = useSelector((state: RootState) => state.card);

    useEffect(() => {

        const getCardData = async () => {
            dispatch(setLoading()); // Set loading state to true
            try {
                const cardData = await fetchCardByQuery('Lightning Bolt');
                dispatch(setCard(cardData)); // Set the fetched card to Redux state
            } catch (error: any) {
                dispatch(setError('Failed to fetch card'));
            }
        };

        getCardData();
    }, [dispatch]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div>
            <h1>{card?.name}</h1>
            <img src={card?.image_uris.normal} alt={card?.name} />
            <p>{card?.oracle_text}</p>
        </div>
    );
};

export default Card;
