import PropTypes from "prop-types";
import { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectUser } from "../../redux/session/selectors";
import { selectIsModalEditTransactionOpen } from "../../redux/global/selectors";
import { selectTransactions } from "../../redux/finance/selectors";
import { setIsModalEditTransactionOpen } from "../../redux/global/globalSlice";
import { updateTransaction } from "../../redux/finance/operations";
import { DropdownMenu } from "../DropdownMenu/DropdownMenu";
import { Calendar } from "../ModalAddTransaction/Calendar/Calendar";
import { Notify } from "notiflix";
import css from "./ModalEditTransaction.module.css";

import { fetchTransactions } from "../../redux/finance/operations";

export const ModalEditTransaction = ({ transactionId }) => {
  const modalRef = useRef(null);
  const dispatch = useDispatch();

  const user = useSelector(selectUser);

  const allTransactions = useSelector(selectTransactions);

  const selectedTransaction = allTransactions.find(
    (transaction) => transaction._id === transactionId
  );

  const [updatedCategory, setUpdatedCategory] = useState(
    selectedTransaction.category
  );
  const [updatedDate, setUpdatedDate] = useState(selectedTransaction.date);

  const isModalEditTransactionOpen = useSelector(
    selectIsModalEditTransactionOpen
  );

  function formatDate(inputDate) {
    const date = new Date(inputDate);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear().toString();

    return `${month}.${day}.${year}`;
  }

  const handleUpdatedCategory = (category) => {
    setUpdatedCategory(category);
  };

  const handleUpdatedDate = (newDate) => {
    setUpdatedDate(newDate.format("DD.MM.YYYY"));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const updatedAmount = form.elements.amount.value;
    const updatedComment = form.elements.comment.value;

    if (!updatedAmount || undefined) {
      Notify.info("Please provide a valid amount.");
      return;
    }
    const cleanedAmount = updatedAmount.replace(/\s/g, "").replace(",", ".");
    const numberUpdatedAmount = parseFloat(cleanedAmount);

    dispatch(
      updateTransaction({
        transactionId: selectedTransaction._id,
        type: selectedTransaction.type,
        category: updatedCategory,
        amount: numberUpdatedAmount,
        date: updatedDate,
        comment: updatedComment || "",
        owner: selectedTransaction.owner,
      })
    );
    document.body.style.overflow = "unset";
    Notify.success("Transaction updated successfully.");
    form.reset();
    dispatch(fetchTransactions(user.id));
    dispatch(setIsModalEditTransactionOpen(false));
  };

  const handleModalClose = () => {
    const form = document.getElementById("form");
    form.reset();
    document.body.style.overflow = "unset";
    dispatch(setIsModalEditTransactionOpen(false));
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        dispatch(setIsModalEditTransactionOpen(false));
        document.body.style.overflow = "unset";
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      document.body.style.overflow = "unset";
      dispatch(setIsModalEditTransactionOpen(false));
    }
  };

  const incomeClass = selectedTransaction.type === "income" ? css.income : "";
  const expenseClass =
    selectedTransaction.type === "expense" ? css.expense : "";

  const backdropClass = isModalEditTransactionOpen
    ? css.backdropEditIsOpen
    : css.backdropEdit;

  return (
    <div className={backdropClass} onClick={handleBackdropClick}>
      <div className={css.container} ref={modalRef}>
        <h2 className={css.title}>Edit transaction</h2>
        <div className={css.switchContainer}>
          <p className={incomeClass}>Income</p>
          <p className={css.slash}>/</p>
          <p className={expenseClass}>Expense</p>
        </div>
        <form id="form" className={css.form} onSubmit={handleSubmit}>
          {selectedTransaction.type === "expense" ? (
            <DropdownMenu
              category={updatedCategory}
              onClick={handleUpdatedCategory}
            />
          ) : null}
          <div className={css.formInnerBox}>
            <input
              name="amount"
              type="text"
              pattern="[0-9]+([,\\.][0-9]+)?"
              onInput={(e) => {
                e.target.value = e.target.value.replace(/[^0-9,\\.]/g, "");
              }}
              className={css.money}
              placeholder={selectedTransaction.amount}
            ></input>
            <Calendar
              date={formatDate(selectedTransaction.date)}
              onChange={handleUpdatedDate}
            />
          </div>
          <textarea
            name="comment"
            className={css.comment}
            placeholder={selectedTransaction.comment}
          ></textarea>
          <button type="submit" className={css.btnGreen}>
            SAVE
          </button>
        </form>
        <button onClick={handleModalClose} className={css.btnCancel}>
          CANCEL
        </button>
      </div>
    </div>
  );
};

ModalEditTransaction.propTypes = {
  transactionId: PropTypes.string,
};
