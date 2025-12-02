import { collection, addDoc, doc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "../../config/firebase";
import { getCurrentUser } from "../auth/firebaseAuth";

export interface EventData {
  tournamentName: string;
  athlete1Dupla1: string;
  country1Dupla1: string;
  athlete2Dupla1: string;
  country2Dupla1: string;
  athlete1Dupla2: string;
  country1Dupla2: string;
  athlete2Dupla2: string;
  country2Dupla2: string;
  gamesWithAdvantage: boolean;
  gameTime: boolean;
  gameStatistics: boolean;
  isSingles: boolean;
  createdAt: Timestamp | Date;
  createdBy: string;
}

export interface EventDocument extends EventData {
  id: string;
}

export const createEvent = async (eventData: Omit<EventData, "createdAt" | "createdBy">): Promise<string> => {
  try {
    const user = getCurrentUser();
    if (!user) {
      throw new Error("Usuário não autenticado");
    }

    const event: Omit<EventData, "id"> = {
      ...eventData,
      createdAt: Timestamp.now(),
      createdBy: user.uid,
    };

    const docRef = await addDoc(collection(db, "events"), event);
    return docRef.id;
  } catch (error: any) {
    throw new Error(`Erro ao criar evento: ${error.message}`);
  }
};

export const getEvent = async (eventId: string): Promise<EventDocument | null> => {
  try {
    const docRef = doc(db, "events", eventId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as EventDocument;
    }
    return null;
  } catch (error: any) {
    throw new Error(`Erro ao buscar evento: ${error.message}`);
  }
};
