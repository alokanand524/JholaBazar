import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface OrderState {
  orders: any[];
}

const initialState: OrderState = {
  orders: [],
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    addOrder: (state, action: PayloadAction<any>) => {
      state.orders.unshift(action.payload);
    },
    setOrders: (state, action: PayloadAction<any[]>) => {
      state.orders = action.payload;
    },
  },
});

export const { addOrder, setOrders } = ordersSlice.actions;
export default ordersSlice.reducer;